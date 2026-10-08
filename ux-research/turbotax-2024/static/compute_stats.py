"""Statistics over the extracted TurboTax 2024 interview screens.

Usage:  python -I compute_stats.py [out-dir]
Reads screens.jsonl + screen_instances.jsonl + topic-tree.json from out-dir and writes
stats.json and stats.md.  All shares are over DISTINCT SCREEN IDs unless stated (a screen
id can have several content variants; a screen counts if any variant matches).
"""
import collections
import json
import os
import re
import sys

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.dirname(os.path.abspath(__file__))
S_ALL = [json.loads(l) for l in open(os.path.join(OUT, "screens.jsonl"), encoding="utf-8")]
S = [s for s in S_ALL if not s.get("debug_screen")]  # developer/debug screens (dbg*, test*) excluded
I = [json.loads(l) for l in open(os.path.join(OUT, "screen_instances.jsonl"), encoding="utf-8")]
T = json.load(open(os.path.join(OUT, "topic-tree.json"), encoding="utf-8"))

by_id = collections.defaultdict(list)
for s in S:
    by_id[s["screen_id"]].append(s)
ids = sorted(by_id)
NID = len(ids)


def titles_of(s):
    if s["title_variants"]:
        return s["title_variants"]
    return [t.strip() for t in s["title"].split(" | ") if t.strip()] if s["title"] else []


def text_of(s):
    return " ".join(titles_of(s) + s["body"] + s["options"] + s["buttons"] + s["fields"])


def share(pred):
    n = sum(1 for i in ids if any(pred(s) for s in by_id[i]))
    return n, round(100.0 * n / NID, 1)


stats = collections.OrderedDict()
stats["screen_instances"] = len(I)
stats["distinct_screen_ids"] = NID
stats["distinct_screen_contents"] = len(S)
stats["debug_screens_excluded"] = len({s["screen_id"] for s in S_ALL if s.get("debug_screen")})
stats["instances_by_program"] = dict(collections.Counter(x["program"] for x in I).most_common())
stats["modules_with_screens"] = len({x["module"] for x in I})
stats["topic_tree_nodes"] = len(T["nodes"])
stats["topic_tree_nodes_titled"] = sum(1 for n in T["nodes"] if n["title"])
stats["screens_without_decoded_title"] = share(lambda s: not titles_of(s))
stats["screens_without_body_text"] = share(lambda s: not s["body"])

# ---------------------------------------------------------------- titles
all_titles = []
for i in ids:
    for s in by_id[i]:
        all_titles += titles_of(s)
norm = lambda t: re.sub(r"\{[^}]+\}", "{X}", re.sub(r"\s+", " ", t)).strip()
distinct_titles = sorted({norm(t) for t in all_titles if t})
stats["distinct_titles"] = len(distinct_titles)

PATTERNS = collections.OrderedDict([
    ("Did you ...", r"^did (you|{x})\b"),
    ("Do you ... / Does ...", r"^(do you|does )\b"),
    ("Are you / Is / Were / Was ...", r"^(are you|is |were |was |have you|has )"),
    ("Enter ...", r"^enter\b"),
    ("Tell us ...", r"^tell us\b"),
    ("Let's ...", r"^let(')?s\b"),
    ("Do any of these apply ...", r"^do any of these (apply|situations)"),
    ("Which / What / How / Where / When ...", r"^(which|what|how|where|when|who)\b"),
    ("Your ... / About your ... (noun heading)", r"^(your |about (your|{x}))"),
    ("Here's ... / Here are ...", r"^here('s| is| are)\b"),
    ("We ... (We'll, We've, We noticed) ", r"^we('ll|'ve| noticed| need| can| recommend| found| have)\b"),
    ("Review / Check / Confirm / Double-check ...", r"^(review|check|confirm|double-check|let's check|let's double)"),
    ("Select / Choose / Pick ...", r"^(select|choose|pick)\b"),
    ("Good news / Great news / Congratulations", r"^(good news|great news|congrat|nice|awesome|you're all set|you're done)"),
])
tp = collections.OrderedDict()
for name, rx in PATTERNS.items():
    c = sum(1 for t in distinct_titles if re.search(rx, t.lower().replace("{x}", "{x}")))
    tp[name] = [c, round(100.0 * c / max(1, len(distinct_titles)), 1)]
tp["ends with '?' (any question)"] = [sum(1 for t in distinct_titles if t.rstrip().endswith("?")),
                                      round(100.0 * sum(1 for t in distinct_titles if t.rstrip().endswith("?")) / len(distinct_titles), 1)]
tp["contains a personalization token"] = [sum(1 for t in distinct_titles if "{X}" in t),
                                          round(100.0 * sum(1 for t in distinct_titles if "{X}" in t) / len(distinct_titles), 1)]
tp["Title Case (>=60% of words capitalised)"] = [0, 0]
tc = 0
for t in distinct_titles:
    w = [x for x in re.findall(r"[A-Za-z][A-Za-z']*", t) if len(x) > 3]
    if w and sum(1 for x in w if x[0].isupper()) / len(w) >= 0.6:
        tc += 1
tp["Title Case (>=60% of words capitalised)"] = [tc, round(100.0 * tc / len(distinct_titles), 1)]
stats["title_patterns_over_distinct_titles"] = tp
first2 = collections.Counter(" ".join(t.split()[:2]) for t in distinct_titles)
stats["top_title_openings"] = first2.most_common(40)

# ---------------------------------------------------------------- screen features
feat = collections.OrderedDict()
feat["has 'Learn More' link"] = share(lambda s: s["learn_more"])
feat["has any in-text help link"] = share(lambda s: bool(s["links"]))
feat["has radio/checkbox options"] = share(lambda s: bool(s["options"]))
feat["has buttons (Yes/No/Done ...)"] = share(lambda s: bool(s["buttons"]))
feat["Yes/No buttons"] = share(lambda s: "Yes" in s["buttons"] and "No" in s["buttons"])
feat["sentence-style Yes/No options ('Yes, I ...')"] = share(
    lambda s: any(re.match(r"^(yes|no)[,.] ", o.lower()) for o in s["options"]))
feat["has input fields"] = share(lambda s: bool(s["fields"]))
feat["add/edit/delete summary table"] = share(lambda s: any(f.startswith("[table]") for f in s["fields"]))
feat["has image"] = share(lambda s: bool(s["images"]))
feat["has drop-down"] = share(lambda s: bool(s["dropdowns"]))
feat["personalization token anywhere"] = share(lambda s: bool(s["personalization_tokens"]))
NAME_RX = re.compile(r"NAM|NAME|FIRST|PAYER|BIZ|BUSINESS|EMPLOYER|THISKID|DEPEND|SPOUSE|PERSON|WHO|LENDER|ASSET|PROPERTY|INST", re.I)
YEAR_RX = re.compile(r"YR|YEAR|CURR|PRIOR|LAST", re.I)
feat["token looks like a name/entity (person, payer, business, asset)"] = share(
    lambda s: any(NAME_RX.search(t) for t in s["personalization_tokens"]))
feat["token looks like a year"] = share(lambda s: any(YEAR_RX.search(t) for t in s["personalization_tokens"]))
feat["runtime value placeholder {value}"] = share(lambda s: "{value}" in s["personalization_tokens"])
stats["screen_features"] = feat

# ---------------------------------------------------------------- vocabulary / tone
LEX = collections.OrderedDict([
    ("'uncommon' / 'less common'", r"\b(uncommon|less common|less-common)\b"),
    ("'Good news' / 'Great news'", r"\b(good news|great news)\b"),
    ("'We've chosen' / 'we chose' / 'we picked'", r"\b(we've chosen|we chose|we picked|we've picked|we selected|we've selected)\b"),
    ("'recommend(ed)'", r"\brecommend"),
    ("'Don't worry'", r"\bdon'?t worry\b"),
    ("'We noticed' / 'Looks like'", r"\b(we noticed|looks like|it looks like)\b"),
    ("'Let's' anywhere", r"\blet'?s\b"),
    ("'we'll' (system does work for you)", r"\bwe'll\b"),
    ("'Most people' / 'most taxpayers'", r"\bmost (people|taxpayers|folks)\b"),
    ("'Do any of these apply'", r"do any of these apply"),
    ("'None of these apply' / 'None of the above'", r"none of (these|the above)"),
    ("'Select ... to continue' / 'Continue'", r"\b(select|click) (continue|done|yes|no)\b"),
    ("'double-check' / 'Let's check'", r"double-check|let's check|lets check"),
    ("'upgrade' / edition upsell", r"\bupgrade\b|\bpremier\b|\bhome & business\b|\bdeluxe\b"),
    ("'expert' / 'Live' assistance", r"\bexpert\b|\blive tax advice\b|\bcpa\b"),
    ("'(optional)' / 'if applicable'", r"\(optional\)|if applicable"),
    ("'Why do we ask' / 'Why we ask'", r"why (do )?we (ask|need)"),
    ("'TurboTip' / 'Tip:'", r"turbotip|\btip:"),
    ("'You're all set' / 'Nice work' / 'Done'", r"you're all set|nice work|great job|you're done|all done"),
    ("'savings' / 'saved' / 'maximize'", r"\bsav(ed|ings?)\b|\bmaximi[sz]e"),
])
lex = collections.OrderedDict()
for name, rx in LEX.items():
    n, pct = share(lambda s, rx=rx: re.search(rx, text_of(s), re.I) is not None)
    ex = []
    for i in ids:
        for s in by_id[i]:
            for t in titles_of(s) + s["body"] + s["options"]:
                m = re.search(rx, t, re.I)
                if m and len(ex) < 4 and t not in ex:
                    ex.append(t[:200])
    lex[name] = {"screens": n, "pct": pct, "examples": ex}
stats["lexicon"] = lex

# outcome-style screens (titles announcing a result / decision made for the user)
OUT_RX = r"^(good news|great news|congrat|you('re| are) (all set|done|eligible|not eligible)|you (qualify|don't qualify|do not qualify|can|can't|cannot)|we('ve| have) (chosen|picked|selected|determined|figured|calculated)|your .* (results?|summary)$|here's (what|your|how)|you saved|you('ve| have) saved)"
outc = [t for t in distinct_titles if re.search(OUT_RX, t.lower())]
stats["outcome_style_titles"] = {"count": len(outc), "pct_of_distinct_titles": round(100.0 * len(outc) / len(distinct_titles), 1),
                                 "examples": outc[:40]}

# body length
wc = [len(" ".join(s["body"]).split()) for s in S if s["body"]]
wc.sort()
stats["body_words_per_screen_variant"] = {"median": wc[len(wc) // 2], "p90": wc[int(len(wc) * 0.9)], "max": wc[-1]}
kinds = collections.Counter()
for s in S:
    for k, v in s["control_kinds"].items():
        kinds[int(k)] += v
KN = {1: "container", 2: "grid container", 3: "text", 7: "image", 8: "spacer", 9: "button", 13: "input field",
      14: "checkbox", 16: "drop-down", 17: "radio group", 20: "add/edit/delete table", 25: "action button",
      26: "embedded web widget", 28: "radio option", 29: "container (alt)", 32: "rule", 35: "container (#)",
      36: "container ($)", 37: "sub-screen include"}
stats["control_kind_counts"] = {"%d %s" % (k, KN.get(k, "?")): v for k, v in kinds.most_common()}
tok = collections.Counter()
for s in S:
    for t in s["personalization_tokens"]:
        tok[t] += 1
stats["top_personalization_tokens"] = tok.most_common(40)

json.dump(stats, open(os.path.join(OUT, "stats.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)

# ---------------------------------------------------------------- markdown
L = ["# Statistics (generated by compute_stats.py)\n"]
L.append("| measure | value |\n|---|---|")
for k in ["screen_instances", "distinct_screen_ids", "distinct_screen_contents", "debug_screens_excluded", "modules_with_screens",
          "topic_tree_nodes", "topic_tree_nodes_titled", "distinct_titles"]:
    L.append("| %s | %s |" % (k.replace("_", " "), stats[k]))
L.append("| screens without decoded title | %d (%.1f%%) |" % tuple(stats["screens_without_decoded_title"]))
L.append("| screens without body text | %d (%.1f%%) |" % tuple(stats["screens_without_body_text"]))
L.append("| body words per screen variant (median / p90 / max) | %(median)d / %(p90)d / %(max)d |" % stats["body_words_per_screen_variant"])
L.append("\nInstances by compiled program: " + ", ".join("%s %d" % kv for kv in stats["instances_by_program"].items()))
L.append("\n## Title phrasing (over %d distinct titles; tokens normalised to {X})\n" % len(distinct_titles))
L.append("| pattern | titles | % |\n|---|---|---|")
for k, (c, p) in tp.items():
    L.append("| %s | %d | %.1f |" % (k, c, p))
L.append("\nMost common two-word openings: " + ", ".join('"%s" %d' % kv for kv in stats["top_title_openings"][:30]))
L.append("\n## Screen features (over %d distinct screen ids)\n" % NID)
L.append("| feature | screens | % |\n|---|---|---|")
for k, (c, p) in feat.items():
    L.append("| %s | %d | %.1f |" % (k, c, p))
L.append("\n## Vocabulary and tone (screen ids whose title/body/options/buttons contain the phrase)\n")
L.append("| phrase | screens | % | example |\n|---|---|---|---|")
for k, v in lex.items():
    L.append("| %s | %d | %.1f | %s |" % (k, v["screens"], v["pct"], (v["examples"][0] if v["examples"] else "").replace("|", "/")[:160]))
L.append("\n## Outcome-style titles (%d, %.1f%% of distinct titles)\n" % (len(outc), stats["outcome_style_titles"]["pct_of_distinct_titles"]))
for t in outc[:40]:
    L.append("- " + t)
L.append("\n## Control kinds (all distinct screen variants)\n")
L.append(", ".join("%s: %d" % kv for kv in stats["control_kind_counts"].items()))
L.append("\n## Most frequent personalization tokens\n")
L.append(", ".join("`%s` %d" % kv for kv in stats["top_personalization_tokens"]))
open(os.path.join(OUT, "stats.md"), "w", encoding="utf-8").write("\n".join(L) + "\n")
print(json.dumps({k: stats[k] for k in ["distinct_screen_ids", "distinct_titles"]}))
