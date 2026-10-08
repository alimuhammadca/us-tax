"""Static extractor for TurboTax 2024 desktop interview screens (fdiin.1pe).

Read-only: it opens the .1pe file for reading and writes CSV/JSONL output only.

Usage:
    python -I extract_screens.py [path-to-fdiin.1pe] [out-dir]

Defaults: the standard install path, and the directory containing this script.

Reverse-engineered layout (empirical, see README.md for the evidence and caveats):

* The file is an "XPRF" container: magic, u16 version fields, u16 section count at
  offset 10, then 12-byte section records (u16 type, u16 index, u32 offset, u32 length).
  The sections hold compiled interview "functions" (modules). We do not need the
  section table to find screens; we pattern-match inside the whole file.
* A module (function) starts with `00 00 00 00 00 01 <NAME> 00` (e.g. GETKEEPUPHOMEQUESTION).
* A "display screen" statement is opcode `0x34` ('4') + u32, then a fixed 13-byte header
  `01 00 01 01 ?? 01 01 ?? 00 00 00 ?? 00`, then a title EXPRESSION, then the screen id
  as a length-prefixed string (`<len>fdiNNNNNNNN[...]`), then 1-3 numeric arguments
  (`03 01 <len> <digits>` or `03 00 00`), then a CONTROL TABLE:
      u16 count, count x u32 offsets (first offset == 2 + 4*count), relative to the u16.
* A control = u8 kind, 10 attribute bytes, then kind-specific payload.  Containers
  (kinds 1, 2, 29, 35, 36, ...) carry a u32 size and a nested control table at +15;
  container end = start + 16 + size.  Leaf kinds observed:
      3 static text / label   (rich text)        7 image (intgfx_*/icn_* name)
      8 spacer                                    9 button (string literal label)
      13 input field (literal label)              14 checkbox (rich text label)
      16 drop-down (label + option literals)      17 radio group (rich text options)
      20 repeating-item table ("Add Another")     25 action button (e.g. Talk to an Expert)
      26 embedded HTML/web widget                 28 radio option (rich text label)
      32 horizontal rule                          37 included sub-screen / statement
* Rich text = `09 <u32 len> <u32 len> <bytes>`.  Inside: `02 <style>` opens a style,
  `08` closes a style or ends a paragraph, `07 <varidx> 00 00 00 00` is a module
  variable, `06 .. ff <32-byte name> 00 00 <n> 00` is a form field / screen
  parameter, `05 <target> 08 08 08 <label> 08 08` is a help hyperlink ("Learn More"),
  `0e <url> 08 08 <label> 08 08` an external URL link.  After the text a few
  length-prefixed attributes may follow (e.g. a radio GROUP name).
* Expressions (prefix notation): `03 02 <len> <str>` string literal, `03 01 <len> <num>`
  numeric literal, `04 <idx> 01 00 <type> 00 00 <len> <NAME> 00 00` variable reference,
  `01 <op> 00 05|03 00 <n> 00` operator with n operands (op 0x0b = concatenate),
  `07 00 01 00 ...` a tax-form field reference (form + field names, space-padded to 32).
"""
import csv
import json
import os
import re
import struct
import sys
from collections import defaultdict

DEFAULT_SRC = r"C:\Program Files\TurboTax\Individual 2024\Forms\1040_24\fdiin.1pe"

SRC = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_SRC
OUT = sys.argv[2] if len(sys.argv) > 2 else os.path.dirname(os.path.abspath(__file__))

d = open(SRC, "rb").read()
N = len(d)

# ---------------------------------------------------------------- modules
MOD_RE = re.compile(rb"\x00\x00\x00\x00\x00\x01([A-Z][A-Z0-9_]{2,})\x00")
mod_starts = [(m.start(), m.group(1).decode()) for m in MOD_RE.finditer(d)]
mod_pos = [p for p, _ in mod_starts]


def module_of(pos):
    import bisect
    i = bisect.bisect_right(mod_pos, pos) - 1
    if i < 0:
        return None, 0, mod_pos[0] if mod_pos else N
    end = mod_pos[i + 1] if i + 1 < len(mod_pos) else N
    return mod_starts[i][1], mod_starts[i][0], end


VAR_RE = re.compile(rb"[\x00\x01\x04](.)\x01\x00.\x00\x00([\x01-\x30])([A-Z][A-Z0-9_]*)\x00\x00", re.S)
_varcache = {}


def module_vars(mstart, pos, mend):
    """idx -> variable name.  A module region can hold several compiled functions that
    reuse the same indexes, so the declaration/reference NEAREST BEFORE the screen wins;
    names first seen after the screen fill remaining gaps."""
    m = {}
    for x in VAR_RE.finditer(d, mstart, pos):
        if x.group(2)[0] == len(x.group(3)):
            m[x.group(1)[0]] = x.group(3).decode()
    for x in VAR_RE.finditer(d, pos, mend):
        if x.group(2)[0] == len(x.group(3)):
            m.setdefault(x.group(1)[0], x.group(3).decode())
    return m


# ---------------------------------------------------------------- expressions
def _s(b):
    return b.decode("cp1252", "replace")


CURVARS = [{}]


def parse_expr(p, end, depth=0):
    """Return (text, newpos) or (None, p) if not parseable."""
    if p >= end or depth > 12:
        return None, p
    b = d[p]
    if b == 0x03 and d[p + 1] in (1, 2):
        ln = d[p + 2]
        return _s(d[p + 3:p + 3 + ln]), p + 3 + ln
    if b == 0x03 and d[p + 1] == 0 and d[p + 2] == 0:
        return "", p + 3
    if b == 0x04 and d[p + 2] == 0x01 and d[p + 3] == 0 and d[p + 5] == 0 and d[p + 6] == 0:
        ln = d[p + 7]
        name = d[p + 8:p + 8 + ln]
        if re.fullmatch(rb"[A-Z][A-Z0-9_]*", name or b"-") and d[p + 8 + ln:p + 10 + ln] == b"\x00\x00":
            return "{" + name.decode() + "}", p + 10 + ln
    if b == 0x01 and d[p + 2] == 0 and d[p + 3] in (3, 5) and d[p + 4] == 0 and d[p + 6] == 0:
        op, n = d[p + 1], d[p + 5]
        q = p + 7
        parts = []
        for _ in range(n):
            t, q2 = parse_expr(q, end, depth + 1)
            if t is None:
                return None, p
            parts.append(t)
            q = q2
        if op == 0x0B:
            return "".join(parts), q
        return "{expr}", q
    if b == 0x09 and d[p + 1:p + 5] == d[p + 5:p + 9]:
        ln = struct.unpack_from("<I", d, p + 1)[0]
        if 0 < ln < 30000:
            c = rich_at(p + 9, ln)
            txt, _, _ = render_rich(c, CURVARS[0])
            return txt, p + 9 + ln + (14 if has_prefix(p + 9) else 0)
    if b == 0x07 and d[p + 1:p + 4] == b"\x00\x01\x00":
        j = d.find(b"\x01\x0eS2024US1040PER", p, min(end, p + 400))
        if j < 0:
            return None, p
        forms = re.findall(rb"\xff([A-Z0-9_]+) *", d[p:j])
        fm = re.match(rb"..\xff([A-Z0-9_ ]{32})(.)", d[j + 15:j + 15 + 40], re.S)
        if not fm:
            return None, p
        field = fm.group(1).strip().decode()
        form = forms[0].decode() if forms else "?"
        k = j + 15 + 2 + 1 + 32
        if d[k] == 1:  # indexed field: 01 <index expression>
            t, k2 = parse_expr(k + 1, end, depth + 1)
            if t is None:
                return None, p
            return "{%s.%s}" % (form, field), k2
        return "{%s.%s}" % (form, field), k + 1
    return None, p


HDR_RE = re.compile(rb"4....\x01[\x00-\x01]\x01\x01[\x00-\x03]\x01\x01[\x00-\x01]\x00\x00[\x00-\x01][\x00-\x09][\x00-\x01]", re.S)

ASSIGN_CACHE = {}


def assignments(var, mstart, mend):
    key = (var, mstart, mend)
    if key in ASSIGN_CACHE:
        return ASSIGN_CACHE[key]
    pat = re.compile(rb"\x01\x01.\x01\x00.\x00\x00" + bytes([len(var)]) + re.escape(var.encode()) + rb"\x00\x00", re.S)
    vals = []
    for m in pat.finditer(d, mstart, mend):
        t, _ = parse_expr(m.end(), mend)
        if t and t not in vals:
            vals.append(t)
    ASSIGN_CACHE[key] = vals
    return vals


# ---------------------------------------------------------------- rich text
VARREF = re.compile(rb"\x07(.)\x00\x00\x00\x00", re.S)
VARREF2 = re.compile(rb"\x07.\x00.\x00.", re.S)
FIELDREF = re.compile(rb"\x06(?:[^\xff]{0,6})\xff([A-Z0-9_ ]{32})\x00\x00(.)\x00", re.S)
LINK = re.compile(rb"([\x05\x0e])([^\x00-\x1f]{1,300}?)\x08\x08\x08?((?:\x02.)?[^\x08]*)\x08", re.S)


def render_rich(c, vars_):
    tokens = []
    links = []

    def fld(m):
        name = m.group(1).strip().decode()
        tok = "{%s}" % name if name else "{value}"
        tokens.append(tok)
        return tok.encode()

    def var(m):
        tok = "{%s}" % vars_.get(m.group(1)[0], "var%d" % m.group(1)[0])
        tokens.append(tok)
        return tok.encode()

    c = FIELDREF.sub(fld, c)
    c = VARREF.sub(var, c)
    c = VARREF2.sub(b"{value}", c)

    def lnk(m):
        target = m.group(2).decode("cp1252", "replace")
        label = re.sub(rb"[\x00-\x1f]", b"", m.group(3)).decode("cp1252", "replace").strip()
        links.append((label, target))
        return ("[%s](%s)" % (label, target)).encode()

    c = LINK.sub(lnk, c)
    # cut trailing length-prefixed attributes (e.g. radio GROUP names)
    out = []
    i = 0
    while i < len(c):
        ch = c[i]
        if ch == 0x08:
            # attribute?  08 <n> <n identifier chars>
            if i + 1 < len(c) and 1 <= c[i + 1] <= 0x20 and c[i + 1] not in (2, 5, 6, 7, 8, 0x0e):
                n = c[i + 1]
                ident = c[i + 2:i + 2 + n]
                if len(ident) == n and re.fullmatch(rb"[A-Za-z0-9_#./-]+", ident):
                    break
            if i + 1 < len(c) and c[i + 1] == 0x08:
                out.append(b"\n")
                i += 2
                continue
            i += 1
            continue
        if ch == 0x02 and i + 1 < len(c):
            i += 2
            continue
        if ch < 0x20 and ch not in (0x0a,):
            i += 1
            continue
        out.append(bytes([ch]))
        i += 1
    txt = b"".join(out).decode("cp1252", "replace")
    txt = re.sub(r"[ \t]+", " ", txt)
    txt = re.sub(r"\n\s*\n+", "\n", txt).strip()
    return txt, tokens, links


def rich_at(p, ln):
    """Rich-text payload; an optional 14-byte paragraph-format prefix is not counted in ln."""
    if has_prefix(p):
        return d[p + 14:p + 14 + ln]
    return d[p:p + ln]


def has_prefix(p):
    """14-byte paragraph-format prefix: u8 flags (1..15), 5 zero bytes, u32, u32 (small)."""
    return (1 <= d[p] <= 15 and d[p + 1:p + 6] == bytes(5) and d[p + 7:p + 10] == bytes(3)
            and d[p + 11:p + 14] == bytes(3))


RT_RE = re.compile(rb"\t(....)\1", re.S)
LIT_RE = re.compile(rb"\x03\x02([\x01-\xff])", re.S)


STOP_RE = re.compile(rb"\x01\x01.\x01\x00.\x00\x00[\x01-\x30][A-Z]|4....\x01[\x00-\x01]\x01\x01", re.S)


def rich_texts_open(s, limit=6000):
    """Rich texts of a last control whose end is unknown: keep taking blocks while they
    stay contiguous (gap < 400 bytes, no variable assignment / screen header in the gap)."""
    res = []
    p = s
    for m in RT_RE.finditer(d, s, min(N, s + limit)):
        gap = d[p:m.start()]
        if res and (len(gap) > 400 or STOP_RE.search(gap)):
            break
        if not res and (m.start() - s > 400 or STOP_RE.search(gap)):
            break
        ln = struct.unpack("<I", m.group(1))[0]
        if not (0 < ln < 30000):
            break
        c = rich_at(m.end(), ln)
        res.append(c)
        p = m.end() + ln + (14 if has_prefix(m.end()) else 0)
    return res


def rich_texts(s, e):
    res = []
    for m in RT_RE.finditer(d, s, e):
        ln = struct.unpack("<I", m.group(1))[0]
        if 0 < ln < 30000 and m.end() + ln <= N:
            res.append(rich_at(m.end(), ln))
    return res


def literals(s, e):
    res = []
    p = s
    while True:
        m = LIT_RE.search(d, p, e)
        if not m:
            break
        ln = m.group(1)[0]
        lit = d[m.end():m.end() + ln]
        if all(32 <= ch < 127 or ch >= 0xA0 for ch in lit):
            res.append(_s(lit))
        p = m.end() + ln
    return res


# ---------------------------------------------------------------- controls
def table(q0, lim=80):
    for q in range(q0, min(q0 + lim, N - 6)):
        c = struct.unpack_from("<H", d, q)[0]
        if 1 <= c <= 80 and struct.unpack_from("<I", d, q + 2)[0] == 2 + 4 * c:
            offs = struct.unpack_from("<%dI" % c, d, q + 2)
            if all(offs[i] < offs[i + 1] for i in range(c - 1)) and offs[-1] < 200000:
                return q, offs
    return None


def walk(q, offs, end, out):
    for i, o in enumerate(offs):
        s = q + o
        k = d[s]
        size = struct.unpack_from("<I", d, s + 11)[0]
        t = table(s + 15, 1) if size < 500000 else None
        if t and t[0] == s + 15 and t[1][-1] < size + 2:
            walk(t[0], t[1], s + 16 + size, out)
            continue
        if i + 1 < len(offs):
            e = q + offs[i + 1]
        elif end:
            e = end
        else:
            e = s + 600  # last top-level leaf of unknown length: bounded window
        out.append((k, s, e, i + 1 == len(offs) and not end))


ID_TOKEN = re.compile(rb"([\x03-\x40])([A-Za-z0-9_][A-Za-z0-9_.\-]{2,63})\x03", re.S)


def first_only(lst, last_unknown):
    return lst[:1] if last_unknown else lst


def find_screens():
    """Yield (header_match, id_pos, screen_id, title_parts or None, table)."""
    for h in HDR_RE.finditer(d):
        q, parts = h.end(), []
        while len(parts) < 8:
            t, q2 = parse_expr(q, min(N, q + 4000))
            if t is None:
                break
            parts.append(t)
            q = q2
        ln = d[q]
        sid = d[q + 1:q + 1 + ln]
        if 3 <= ln <= 64 and re.fullmatch(rb"[A-Za-z0-9_][A-Za-z0-9_.\-]*", sid) and d[q + 1 + ln] == 3:
            tb = table(q + 1 + ln, 60)
            if tb:
                yield h, q, sid.decode(), parts, tb
                continue
        # fallback: title expression not fully decoded - look for the id token directly
        for m in ID_TOKEN.finditer(d, h.end(), min(N, h.end() + 1500)):
            if m.group(1)[0] == len(m.group(2)):
                tb = table(m.end() - 1, 60)
                if tb and tb[0] - m.end() < 30:
                    yield h, m.start(), m.group(2).decode(), None, tb
                    break


rows = []
prev_screen = {}
for hdr, pos, sid, parts, tb in find_screens():
    mod, mstart, mend = module_of(pos)
    vars_ = module_vars(mstart, pos, mend)
    CURVARS[0] = vars_
    # ---- title
    title, title_var, variants, scope = "", "", [], ""
    header_images = []
    if parts is not None:
        header_images = [x for x in parts if re.match(r"(?i)(intgfx|icn|img|interviewgraphic)[_a-z0-9]*$", x.strip())]
        title = " | ".join(x for x in parts if x.strip() and x not in header_images)
        title_decoded = True
    else:
        title = " | ".join(literals(hdr.end(), pos))
        title_decoded = False
    mm = re.fullmatch(r"\{([A-Z][A-Z0-9_]*)\}", title.split(" | ")[0])
    if mm:
        title_var = mm.group(1)
        lo = max(mstart, prev_screen.get(mstart, mstart))
        variants = assignments(title_var, lo, pos)
        scope = "since-previous-screen"
        if not variants:
            variants = assignments(title_var, mstart, mend)
            scope = "whole-module" if variants else ""
    # ---- controls
    leaves = []
    walk(tb[0], tb[1], None, leaves)
    body, options, buttons, fields, dropdowns, images, links, tokens = [], [], [], [], [], [], [], []
    kinds = defaultdict(int)
    for k, s, e, unknown in leaves:
        kinds[k] += 1
        rts = rich_texts_open(s + 1) if unknown else rich_texts(s + 1, e)
        rendered = []
        for c in rts:
            txt, toks, lk = render_rich(c, vars_)
            tokens += toks
            links += lk
            if txt:
                rendered.append(txt)
        if k in (14, 28) and not rendered:
            vm = list(re.finditer(rb"\x04.\x01\x00.\x00\x00([\x01-\x30])([A-Z][A-Z0-9_]*)\x00\x00", d[s:min(e, s + 160)], re.S))
            if len(vm) >= 2:
                for v in (assignments(vm[1].group(2).decode(), max(mstart, prev_screen.get(mstart, mstart)), pos)
                          or assignments(vm[1].group(2).decode(), mstart, mend)):
                    if v not in rendered:
                        rendered.append(v)
        if k == 3:
            body += rendered
        elif k in (14, 17, 28):
            options += rendered
        elif k in (9, 25):
            lits = literals(s + 1, min(e, s + 120))
            buttons += [x for x in lits[:1] if x]
        elif k in (13, 16):
            lits = literals(s + 1, e if not unknown else min(e, s + 400))
            if lits:
                fields.append(lits[0])
                if k == 16 and len(lits) > 1:
                    dropdowns.append(lits[0] + ": " + " / ".join(x for x in lits[1:] if x)[:400])
            body += rendered
        elif k == 7:
            lits = literals(s + 1, min(e, s + 80))
            images += lits[:1]
        elif k == 20:
            lits = literals(s + 1, min(e, s + 600))
            fields.append("[table] " + " / ".join(x for x in lits if x)[:200])
        else:
            body += rendered
    tl_tokens = re.findall(r"\{[^}]+\}", " ".join(variants) if variants else title)
    if title_var:
        tokens = [t for t in tokens if t != "{%s}" % title_var]
    learn = [l for l in links if l[0].lower().startswith("learn more")]
    prev_screen[mstart] = pos
    rows.append({
        "screen_id": sid,
        "module": mod,
        "offset": pos,
        "title": title,
        "title_variable": title_var,
        "title_variants": variants,
        "title_variant_scope": scope,
        "body": body,
        "options": options,
        "buttons": buttons,
        "fields": fields,
        "dropdowns": dropdowns,
        "links": ["%s -> %s" % l for l in links],
        "learn_more": bool(learn),
        "images": header_images + images,
        "personalization_tokens": sorted(set(tokens + tl_tokens)),
        "control_kinds": dict(sorted(kinds.items())),
        "parsed_controls": bool(tb),
        "title_fully_decoded": title_decoded,
        "debug_screen": bool(re.match(r"(?i)(dbg|debug|test)", sid)),
    })

# ---------------------------------------------------------------- program attribution
# XPRF header: u32 entry count at offset 12, then 12-byte entries from offset 16:
# (u16 type, u16 program index, u32 offset, u32 length).  Type 0x0ce4 entries name the
# 9 compiled "programs" (REVIEW, EFINTERVIEW, ..., INTERVIEW); every other section carries
# the program index it belongs to.
nsec = struct.unpack_from("<I", d, 12)[0]
secs = [struct.unpack_from("<HHII", d, 16 + 12 * k) for k in range(nsec)]
prog_names = {}
for t, idx, o, l in secs:
    if t == 0x0CE4:
        mm = re.search(rb"\x00([\x03-\x20])([A-Z]+)\x01", d[o:o + l])
        prog_names[idx] = mm.group(2).decode() if mm else str(idx)
code_secs = sorted((o, o + l, idx) for t, idx, o, l in secs if t not in (0x0CE4,))


def program_of(p):
    for o, e, idx in code_secs:
        if o <= p < e:
            return prog_names.get(idx, str(idx))
    return "?"


for r in rows:
    r["program"] = program_of(r["offset"])

os.makedirs(OUT, exist_ok=True)
with open(os.path.join(OUT, "screen_instances.jsonl"), "w", encoding="utf-8") as f:
    for r in rows:  # slim index: one line per compiled occurrence
        f.write(json.dumps({k: r[k] for k in ("screen_id", "module", "program", "offset", "title")},
                           ensure_ascii=False) + "\n")

# ---------------------------------------------------------------- de-duplicate
# The same screen is compiled into several programs and several modules; collapse
# instances whose visible content is identical.
groups = {}
for r in rows:
    key = (r["screen_id"], r["title"], tuple(r["title_variants"]), tuple(r["body"]),
           tuple(r["options"]), tuple(r["buttons"]), tuple(r["fields"]))
    g = groups.get(key)
    if g is None:
        g = dict(r)
        g["occurrences"] = 0
        g["modules"] = []
        g["programs"] = []
        groups[key] = g
    g["occurrences"] += 1
    if r["module"] not in g["modules"]:
        g["modules"].append(r["module"])
    if r["program"] not in g["programs"]:
        g["programs"].append(r["program"])
screens = sorted(groups.values(), key=lambda g: (g["screen_id"], g["offset"]))

with open(os.path.join(OUT, "screens.jsonl"), "w", encoding="utf-8") as f:
    for g in screens:
        g2 = {k: v for k, v in g.items() if k not in ("module", "program", "offset", "parsed_controls")}
        g2["first_offset"] = g["offset"]
        f.write(json.dumps(g2, ensure_ascii=False) + "\n")

with open(os.path.join(OUT, "screens.csv"), "w", encoding="utf-8-sig", newline="") as f:
    w = csv.writer(f)
    w.writerow(["screen_id", "title", "title_variants", "body", "options", "buttons", "fields",
                "dropdowns", "links", "learn_more", "images", "personalization_tokens",
                "control_kinds", "modules", "programs", "occurrences", "first_offset"])
    J = " || ".join
    for g in screens:
        w.writerow([g["screen_id"], g["title"], J(g["title_variants"]), J(g["body"]), J(g["options"]),
                    J(g["buttons"]), J(g["fields"]), J(g["dropdowns"]), J(g["links"]),
                    int(g["learn_more"]), J(g["images"]), " ".join(g["personalization_tokens"]),
                    json.dumps(g["control_kinds"]), " ".join(g["modules"]), " ".join(g["programs"]),
                    g["occurrences"], g["offset"]])

print("screen instances:", len(rows), "| distinct screen ids:", len({r['screen_id'] for r in rows}),
      "| distinct screen contents:", len(screens), "| modules:", len(mod_starts),
      "| programs:", prog_names)
