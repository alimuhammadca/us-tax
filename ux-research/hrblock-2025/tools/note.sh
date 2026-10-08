#!/usr/bin/env bash
# note.sh NNN "<Type>" "<note>"   -> appends to notes.jsonl
python -c "import json,sys;print(json.dumps({'n':int(sys.argv[1]),'type':sys.argv[2],'note':sys.argv[3]}))" "$1" "$2" "$3" >> C:/us-tax/ux-research/hrblock-2025/tools/notes.jsonl
