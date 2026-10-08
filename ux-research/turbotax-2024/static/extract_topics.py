"""Extract the TurboTax 2024 interview TOPIC TREE (the "hub" navigation) from fdiin.1pe,
plus the outer EasyStep topic list (TP_*.xml) and the hub "landing table" section headers.

Read-only on the install.  Usage:
    python -I extract_topics.py [install-root] [out-dir]

Topic node record (empirical):
    00 00 00 00 00 00 <ID> 00  <flags ~20 bytes>  ff ff <u16 idx-in-parent> <PARENT> 00 [<NEXT-SIBLING> 00]
    [optional description rich text 09 <len><len> ... | condition expression]
    01 00 00 01 00 ff ff <TITLE> 00 <u16 n-children> n x (<u8 len><CHILD-ID>)
The interview is compiled into 9 programs (INTERVIEW, REVIEW, ...); topic records are
duplicated across them, so nodes are de-duplicated by ID (first wins).
"""
import json
import os
import re
import struct
import sys
import xml.etree.ElementTree as ET

ROOT = sys.argv[1] if len(sys.argv) > 1 else r"C:\Program Files\TurboTax\Individual 2024"
OUT = sys.argv[2] if len(sys.argv) > 2 else os.path.dirname(os.path.abspath(__file__))
d = open(os.path.join(ROOT, r"Forms\1040_24\fdiin.1pe"), "rb").read()


def clean_rich(c):
    c = re.sub(rb"\x02.", b"", c, flags=re.S)
    c = re.sub(rb"[\x00-\x1f]+", b" ", c)
    return c.decode("cp1252", "replace").strip()


ANCHOR = re.compile(rb"\x01\x00\x00\x01\x00\xff\xff([\x20-\x7e\x91-\x97]{0,160})\x00(..)", re.S)
REC = re.compile(rb"\x00\x00\x00\x00\x00\x00([A-Z][A-Z0-9_]{1,60})\x00[\x00-\x02]\x00[\x00-\x01]\x00", re.S)
PARENT = re.compile(rb"(..)([A-Za-z%][\x20-\x7e]{1,80}?)\x00(?:([A-Z][A-Z0-9_]*)\x00)?", re.S)

nodes = {}
order = []
recs = list(REC.finditer(d))
for i, r in enumerate(recs):
    nid = r.group(1).decode()
    end = recs[i + 1].start() if i + 1 < len(recs) else len(d)
    if end - r.end() > 6000:
        end = r.end() + 6000
    pm = PARENT.search(d, r.end() + 14, min(end, r.end() + 160))
    if pm and pm.start() > r.end() + 40:
        pm = None
    if not pm:
        continue
    m = ANCHOR.search(d, pm.end() - 1, end + 1)
    if not m:
        continue
    title = m.group(1).decode("cp1252", "replace")
    n = struct.unpack("<H", m.group(2))[0]
    p = m.end()
    kids = []
    ok = n <= 200
    for _ in range(n if ok else 0):
        ln = d[p]
        name = d[p + 1:p + 1 + ln]
        if not re.fullmatch(rb"[A-Z][A-Z0-9_]*", name or b"-"):
            ok = False
            break
        kids.append(name.decode())
        p += 1 + ln
    if not ok:
        continue
    idx = struct.unpack("<H", pm.group(1))[0]
    parent = pm.group(2).decode("cp1252", "replace")
    sib = (pm.group(3) or b"").decode()
    desc = ""
    mm = re.search(rb"\t(....)\1", d[pm.end():m.start()], re.S)
    if mm:
        ln = struct.unpack("<I", mm.group(1))[0]
        st = pm.end() + mm.end()
        desc = clean_rich(d[st:st + ln])
    if nid in nodes:
        continue
    nodes[nid] = {"id": nid, "title": title, "parent": parent, "index": idx, "next": sib,
                  "children": kids, "description": desc}
    order.append(nid)

# ------------------------------------------------------------ hub landing table
# "LANDINGTABLESECTIONHEADER" sub-screen calls take (image, heading, subtitle) literals
landing = []
for m in re.finditer(rb"\x19LANDINGTABLESECTIONHEADER", d):
    p = m.end() + 2
    vals = []
    while d[p:p + 2] == b"\x03\x02" and len(vals) < 6:
        ln = d[p + 2]
        vals.append(d[p + 3:p + 3 + ln].decode("cp1252", "replace"))
        p += 3 + ln
    if vals and vals not in landing:
        landing.append(vals)

# ------------------------------------------------------------ EasyStep topic list
es_dir = os.path.join(ROOT, r"64bit\local\EasyStep")
ns = {"t": "intuit:tax:topiclist"}


def read_topiclist(fn, depth=0):
    out = []
    tree = ET.parse(os.path.join(es_dir, os.path.basename(fn)))
    for el in tree.getroot():
        tag = el.tag.split("}")[1]
        if tag == "State":
            nested = el.get("NestedTopicListID")
            out.append({"kind": "State(nested)", "level": None, "file": nested,
                        "items": read_topiclist(nested, depth + 1)})
            continue
        desc = el.find("t:Description", ns)
        cat = el.find("t:Category", ns)
        fn_ = el.find("t:NamedFunction", ns)
        out.append({"kind": tag, "level": el.get("Level"),
                    "description": (desc.text or "").strip() if desc is not None else "",
                    "category": (cat.text or "").strip() if cat is not None and cat.text else "",
                    "entry_point": "%s#%s" % (el.get("EntryPointMapID"), el.get("EntryPointID")),
                    "filter": re.sub(r".*\$", "", (fn_.text or "").strip("[] ")) if fn_ is not None else ""})
    return out


easystep = read_topiclist("TP_1040TOPICLIST.xml")

json.dump({"nodes": [nodes[i] for i in order], "landing_sections": landing, "easystep_topiclist": easystep},
          open(os.path.join(OUT, "topic-tree.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)

# ------------------------------------------------------------ markdown
L = []
L.append("# TurboTax 2024 (TY2024) desktop - topic hierarchy\n")
L.append("Generated by `extract_topics.py` from a read-only scan of the installed product. "
         "Three layers, outermost first.\n")
L.append("## 1. Outer navigation (EasyStep `TP_1040TOPICLIST.xml`)\n")
L.append("The application's top tabs/steps. `Level` is indentation depth; `Category` is the tab label; "
         "`filter` is the C# predicate that hides/shows the item.\n")


def emit_es(items, base=0):
    for it in items:
        if it["kind"] == "State(nested)":
            L.append("%s- *(nested state topic list `%s`)*" % ("  " * base, it["file"].split("\\")[-1]))
            emit_es(it["items"], base + 1)
            continue
        lvl = int(it["level"] or 0) + base
        label = it["description"] or "(%s, no label)" % it["kind"]
        extra = []
        if it["category"]:
            extra.append("Category: **%s**" % it["category"])
        extra.append("`%s`" % it["entry_point"].split("\\")[-1])
        if it["filter"]:
            extra.append("filter `%s`" % it["filter"])
        L.append("%s- %s [%s] - %s" % ("  " * lvl, label, it["kind"], "; ".join(extra)))


emit_es(easystep)

L.append("\n## 2. Federal interview topic tree (from `fdiin.1pe`)\n")
L.append("Each node: **Title** `NODE_ID` - description (if any). Children are listed in the order stored. "
         "%d distinct nodes were decoded. Nodes whose title is empty are invisible routing steps "
         "(imports, de-duplication checks) and are shown in *italics* with their ID only.\n" % len(nodes))

seen = set()


def emit(nid, depth, maxdepth=6):
    n = nodes.get(nid)
    if n is None:
        L.append("%s- `%s` *(no record decoded)*" % ("  " * depth, nid))
        return
    if nid in seen:
        L.append("%s- %s `%s` *(see above)*" % ("  " * depth, n["title"] or "", nid))
        return
    seen.add(nid)
    t = ("**%s**" % n["title"]) if n["title"] else "*(untitled)*"
    desc = (" - " + n["description"]) if n["description"] and n["description"] != n["title"] else ""
    L.append("%s- %s `%s`%s" % ("  " * depth, t, nid, desc[:200]))
    if depth < maxdepth:
        for k in n["children"]:
            emit(k, depth + 1, maxdepth)
    elif n["children"]:
        L.append("%s- ... %d more children" % ("  " * (depth + 1), len(n["children"])))


roots = ["THEVERYTOP"] + [i for i in order if nodes[i]["parent"] not in nodes and i != "THEVERYTOP"
                          and nodes[i]["children"] and nodes[i]["title"]]
emit("THEVERYTOP", 0)
L.append("\n### Other top-level trees (roots whose parent is not itself a decoded node)\n")
L.append("These include the business (Home & Business) topic tree, review/Smart Check alert lists, "
         "and the state/e-file flows.\n")
for r in roots[1:]:
    if r not in seen:
        emit(r, 0, 3)

L.append("\n## 3. Hub landing-table section headers\n")
L.append("Sub-screen `LANDINGTABLESECTIONHEADER(image, heading, subtitle)` calls - the grouped "
         "rows of the 'Wages & Income' / 'Deductions & Credits' hub pages.\n")
L.append("| image | heading | subtitle |\n|---|---|---|")
for v in landing:
    v = v + ["", "", ""]
    L.append("| %s | %s | %s |" % (v[0], v[1].replace("|", "/"), v[2].replace("|", "/")))

open(os.path.join(OUT, "topic-hierarchy.md"), "w", encoding="utf-8").write("\n".join(L) + "\n")
print("topic nodes:", len(nodes), "landing headers:", len(landing))
