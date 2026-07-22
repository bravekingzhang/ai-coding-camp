#!/bin/sh
set -e
cd "$(dirname "$0")/.."
for f in workflow/01-brainstorm.md workflow/02-plan.md workflow/03-impl-notes.md workflow/04-verification.md workflow-log.md; do
  [ -f "$f" ] || { echo "❌ 缺少 $f"; exit 1; }
done
M=$(grep -cE '方案|Option' workflow/01-brainstorm.md); [ "$M" -ge 2 ] || { echo "❌ brainstorm 需 ≥2 个方案"; exit 1; }
grep -q 'AC' workflow/04-verification.md || { echo "❌ verification 需对照 AC"; exit 1; }
echo "✅ 四阶段产物齐备"
