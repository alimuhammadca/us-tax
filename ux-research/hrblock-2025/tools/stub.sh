#!/usr/bin/env bash
# stub.sh NNN slug "<title>" <shell-png-basename>  -> screens/NNN-slug.png + .json with OCR text (for native windows not reachable via CDP)
T=C:/us-tax/ux-research/hrblock-2025
N=$(printf '%03d' $1); cp "$T/shell/$4.png" "$T/screens/$N-$2.png" 2>/dev/null
TXT=$(powershell -ExecutionPolicy Bypass -File "$T/tools/ocr.ps1" -Png "$(cygpath -w "$T/shell/${4}.png")" 2>/dev/null | tr '\n' ' ')
python -c "import json,sys;json.dump({'n':int(sys.argv[1]),'slug':sys.argv[2],'title':sys.argv[3],'text':'[OCR of native window] '+sys.argv[4],'inputs':[],'buttons':[],'native':True},open(sys.argv[5],'w',encoding='utf8'),indent=1)" "$1" "$2" "$3" "$TXT" "$T/screens/$N-$2.json"
echo "{\"n\":$1}" > $T/tools/state.json
