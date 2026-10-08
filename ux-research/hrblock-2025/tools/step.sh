#!/usr/bin/env bash
# One interview step: run actions + capture the WebView screen (ux.mjs), then (unless NOSHELL=1) capture the
# whole native window and OCR the left panel (refund meter + contextual FAQs) and the tab/sub-tab strip.
# Usage: bash step.sh '<actions JSON>' <slug> [--full]
T=C:/us-tax/ux-research/hrblock-2025/tools
node $T/ux.mjs "$@" | cut -c1-260 | head -${LINES_MAX:-45} || exit 1
[ "$NOSHELL" = "1" ] && exit 0
N=$(sed 's/[^0-9]//g' $T/state.json); N=$(printf '%03d' $N)
OUT="C:\\us-tax\\ux-research\\hrblock-2025\\shell\\$N"
powershell -ExecutionPolicy Bypass -File "$T/shellshot.ps1" -Out "$OUT" -NoUia >/dev/null 2>&1
{
  echo "--- LEFT PANEL (meter + FAQs)"; powershell -ExecutionPolicy Bypass -File "$T/ocr.ps1" -Png "$OUT.png" -CropS 278,115,240,690 2>/dev/null
  echo "--- TABS"; powershell -ExecutionPolicy Bypass -File "$T/ocr.ps1" -Png "$OUT.png" -CropS 524,128,745,72 2>/dev/null
} > "$OUT-ocr.txt"
echo "SHELL: $(tr '\n' '|' < "$OUT-ocr.txt" | cut -c1-500)"
