"""Generate a draw.io file from the Mermaid flowchart inside a new_flowcharts/*.md file.

The Markdown file is the source of truth; the .drawio next to it is generated, never hand-edited.

    python mermaid_to_drawio.py ../1a.md            # writes ../1a.drawio
    python mermaid_to_drawio.py --all               # every *.md in new_flowcharts and forms/ (README excluded)

Supported Mermaid subset (keep flowcharts inside it):
    flowchart TD | flowchart LR
    A([Start / end])   A[Step]   A{Decision?}   A[/Input/]   A[[Form / worksheet]]
    A[(Data store)]    A>Flag]   A["quoted text"]   <br/> or <br> for a line break
    A --> B            A -->|label| B      A -- label --> B      A -.-> B      A ==> B
    A --> B --> C      A & B --> C         class A,B flag        A:::flag
    subgraph / end, %% comments, classDef and style lines are accepted and ignored for layout.
Classes that change the colour: input, flag, output, form, warn, oos (out of scope), irs.
"""
import html
import pathlib
import re
import sys

import networkx as nx

SHAPES = [  # (open, close, kind) - longest first
    ("([", "])", "terminal"), ("[[", "]]", "form"), ("[(", ")]", "store"), ("[/", "/]", "input"),
    ("[\\", "\\]", "input"), ("{{", "}}", "decision"), ("((", "))", "terminal"), ("[", "]", "process"),
    ("{", "}", "decision"), ("(", ")", "process"), (">", "]", "flag"),
]
STYLE = {
    "terminal": "rounded=1;arcSize=50;whiteSpace=wrap;html=1;fillColor=#e8eaf6;strokeColor=#3538CD;fontStyle=1;",
    "process": "rounded=1;arcSize=8;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#495057;",
    "decision": "rhombus;whiteSpace=wrap;html=1;fillColor=#fff8e1;strokeColor=#b26a00;",
    "input": "shape=parallelogram;perimeter=parallelogramPerimeter;fixedSize=1;whiteSpace=wrap;html=1;fillColor=#e3f2fd;strokeColor=#1565c0;",
    "form": "shape=process;whiteSpace=wrap;html=1;backgroundOutline=1;fillColor=#ede7f6;strokeColor=#5e35b1;",
    "store": "shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;size=8;fillColor=#eceff1;strokeColor=#546e7a;",
    "flag": "shape=step;perimeter=stepPerimeter;fixedSize=1;size=12;whiteSpace=wrap;html=1;fillColor=#ffebee;strokeColor=#c62828;",
}
CLASS_FILL = {
    "input": "fillColor=#e3f2fd;strokeColor=#1565c0;", "flag": "fillColor=#ffebee;strokeColor=#c62828;",
    "output": "fillColor=#e8f5e9;strokeColor=#2e7d32;", "form": "fillColor=#ede7f6;strokeColor=#5e35b1;",
    "warn": "fillColor=#fff3e0;strokeColor=#e65100;", "oos": "fillColor=#f5f5f5;strokeColor=#9e9e9e;dashed=1;",
    "irs": "fillColor=#fffde7;strokeColor=#f9a825;",
}
NODE_RE = re.compile(r'^\s*([A-Za-z_][\w-]*)\s*')


def parse_node(text):
    """Parse 'Id', 'Id[label]', 'Id:::cls' at the start of text; return (id, label, kind, cls, rest)."""
    m = NODE_RE.match(text)
    if not m:
        raise ValueError(f"cannot parse node in: {text!r}")
    nid, rest = m.group(1), text[m.end():]
    label = kind = None
    for op, cl, k in SHAPES:
        if rest.startswith(op):
            body = rest[len(op):]
            if body.startswith('"'):
                end = body.index('"', 1)
                label, after = body[1:end], body[end + 1:]
                if not after.startswith(cl):
                    raise ValueError(f"unclosed shape for {nid}: {text!r}")
                rest = after[len(cl):]
            else:
                end = body.find(cl)
                if end < 0:
                    raise ValueError(f"unclosed shape for {nid}: {text!r}")
                label, rest = body[:end], body[end + len(cl):]
            kind = k
            break
    cls = None
    m2 = re.match(r':::([\w-]+)', rest)
    if m2:
        cls, rest = m2.group(1), rest[m2.end():]
    return nid, label, kind, cls, rest


EDGE_RE = re.compile(r'^\s*(?:(-->|==>|-\.->)\s*(?:\|([^|]*)\|)?|--\s+([^->][^>]*?)\s+-->|==\s+(.+?)\s+==>|-\.\s+(.+?)\s+\.->)\s*')


def extract_mermaid(md):
    m = re.search(r"```mermaid\s*\n(.*?)```", md, re.S)
    if not m:
        raise ValueError("no ```mermaid block found")
    return m.group(1)


def parse(src):
    nodes, edges, direction = {}, [], "TD"
    for raw in src.splitlines():
        line = raw.split("%%", 1)[0].strip()
        if not line or line.startswith(("classDef", "style ", "linkStyle", "subgraph", "end", "direction")):
            continue
        if line.startswith(("flowchart", "graph")):
            parts = line.split()
            direction = parts[1] if len(parts) > 1 else "TD"
            continue
        if line.startswith("class "):
            _, ids, cls = line.split(None, 2)
            for i in ids.split(","):
                nodes.setdefault(i.strip(), {"label": i.strip(), "kind": "process", "cls": None})["cls"] = cls.strip().rstrip(";")
            continue
        rest, prev, pending_label, pending_style = line, [], "", ""
        while rest:
            group = []
            while True:
                nid, label, kind, cls, rest = parse_node(rest)
                n = nodes.setdefault(nid, {"label": nid, "kind": "process", "cls": None})
                if label is not None:
                    n["label"], n["kind"] = label, kind
                if cls:
                    n["cls"] = cls
                group.append(nid)
                m = re.match(r'\s*&\s*', rest)
                if not m:
                    break
                rest = rest[m.end():]
            for p in prev:
                for g in group:
                    edges.append((p, g, pending_label, pending_style))
            rest = rest.strip().rstrip(";")
            if not rest:
                break
            m = EDGE_RE.match(rest)
            if not m:
                raise ValueError(f"cannot parse edge in: {raw!r} (at {rest!r})")
            arrow = m.group(1) or ("-->" if m.group(3) else "==>" if m.group(4) else "-.->")
            pending_label = next((g for g in m.group(2, 3, 4, 5) if g), "")
            pending_style = {"-->": "", "==>": "strokeWidth=3;", "-.->": "dashed=1;"}[arrow]
            prev, rest = group, rest[m.end():]
    return direction, nodes, edges


def label_html(text):
    parts = re.split(r"<br\s*/?>", text)
    return "<br>".join(html.escape(p.strip().strip('"'), quote=False) for p in parts)


def size(node):
    lines = re.split(r"<br\s*/?>", node["label"])
    longest = max(len(re.sub(r"<[^>]+>", "", l)) for l in lines)
    w = min(max(140, longest * 7 + 36), 380)
    wrapped = sum(max(1, -(-len(l) * 7 // (w - 30))) for l in lines)
    h = max(44, wrapped * 17 + 26)
    if node["kind"] == "decision":
        w, h = int(w * 1.35), int(h * 1.6)
    return w, h


def layout(direction, nodes, edges):
    g = nx.DiGraph()
    g.add_nodes_from(nodes)
    for a, b, *_ in edges:
        g.add_edge(a, b)
    dag = g.copy()  # remove back edges so loops still get ranks
    while not nx.is_directed_acyclic_graph(dag):
        cyc = nx.find_cycle(dag)
        dag.remove_edge(*cyc[-1][:2])
    rank = {}
    for n in nx.topological_sort(dag):
        preds = list(dag.predecessors(n))
        rank[n] = 1 + max((rank[p] for p in preds), default=-1)
    layers = {}
    for n, r in rank.items():
        layers.setdefault(r, []).append(n)
    order = {n: i for i, n in enumerate(nodes)}
    for _ in range(4):  # barycenter sweeps
        for r in sorted(layers):
            if r == 0:
                continue
            pos = {n: i for i, n in enumerate(layers.get(r - 1, []))}
            def bc(n):
                ps = [pos[p] for p in dag.predecessors(n) if p in pos]
                return sum(ps) / len(ps) if ps else order[n]
            layers[r].sort(key=bc)
    sizes = {n: size(nodes[n]) for n in nodes}
    coords, gap_main, gap_cross = {}, 70, 50
    horizontal = direction in ("LR", "RL")
    offset = 40
    max_cross = max(sum((sizes[n][1] if horizontal else sizes[n][0]) + gap_cross for n in layer) for layer in layers.values())
    for r in sorted(layers):
        layer = layers[r]
        thickness = max((sizes[n][0] if horizontal else sizes[n][1]) for n in layer)
        total = sum((sizes[n][1] if horizontal else sizes[n][0]) + gap_cross for n in layer) - gap_cross
        cross = 40 + (max_cross - total) / 2
        for n in layer:
            w, h = sizes[n]
            if horizontal:
                coords[n] = (offset + (thickness - w) / 2, cross)
                cross += h + gap_cross
            else:
                coords[n] = (cross, offset + (thickness - h) / 2)
                cross += w + gap_cross
        offset += thickness + gap_main
    return coords, sizes


def to_drawio(title, direction, nodes, edges):
    coords, sizes = layout(direction, nodes, edges)
    ids = {n: f"n{i}" for i, n in enumerate(nodes)}
    cells = ['<mxCell id="0"/>', '<mxCell id="1" parent="0"/>']
    for n, d in nodes.items():
        style = STYLE[d["kind"]] + "fontSize=12;"
        if d["cls"] in CLASS_FILL:
            style = re.sub(r"fillColor=[^;]*;strokeColor=[^;]*;", "", style) + CLASS_FILL[d["cls"]]
        x, y = coords[n]
        w, h = sizes[n]
        cells.append(f'<mxCell id="{ids[n]}" value="{html.escape(label_html(d["label"]))}" style="{style}" vertex="1" parent="1">'
                     f'<mxGeometry x="{x:.0f}" y="{y:.0f}" width="{w}" height="{h}" as="geometry"/></mxCell>')
    for i, (a, b, lab, est) in enumerate(edges):
        style = "edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;endArrow=block;endFill=1;fontSize=11;labelBackgroundColor=#ffffff;" + est
        cells.append(f'<mxCell id="e{i}" value="{html.escape(label_html(lab))}" style="{style}" edge="1" parent="1" source="{ids[a]}" target="{ids[b]}">'
                     f'<mxGeometry relative="1" as="geometry"/></mxCell>')
    w = int(max(x + sizes[n][0] for n, (x, y) in coords.items()) + 80)
    h = int(max(y + sizes[n][1] for n, (x, y) in coords.items()) + 80)
    return (f'<mxfile host="app.diagrams.net" agent="new_flowcharts/_tools/mermaid_to_drawio.py">\n'
            f'  <diagram id="{re.sub(r"[^\w-]", "-", title)}" name="{html.escape(title)}">\n'
            f'    <mxGraphModel grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" '
            f'pageScale="1" pageWidth="{w}" pageHeight="{h}" math="0" shadow="0">\n      <root>\n        '
            + "\n        ".join(cells) + "\n      </root>\n    </mxGraphModel>\n  </diagram>\n</mxfile>\n")


def convert(md_path):
    md_path = pathlib.Path(md_path)
    md = md_path.read_text(encoding="utf-8")
    t = re.search(r"^#\s+(.+)$", md, re.M)
    direction, nodes, edges = parse(extract_mermaid(md))
    out = md_path.with_suffix(".drawio")
    out.write_text(to_drawio(t.group(1).strip() if t else md_path.stem, direction, nodes, edges), encoding="utf-8")
    return out, len(nodes), len(edges)


if __name__ == "__main__":
    here = pathlib.Path(__file__).resolve().parent.parent
    targets = sorted(p for p in here.rglob("*.md") if p.name.lower() != "readme.md" and "_tools" not in p.parts) if sys.argv[1:] == ["--all"] else sys.argv[1:]
    for p in targets:
        out, n, e = convert(p)
        print(f"{out.name}: {n} nodes, {e} edges")
