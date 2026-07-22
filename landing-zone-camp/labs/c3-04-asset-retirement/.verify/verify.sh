#!/bin/sh
set -e
cd "$(dirname "$0")/.."
F=decision.md
[ -f "$F" ] || { echo "❌ 缺少 decision.md"; exit 1; }
N=$(grep -cE '^\s*(\|\s*)?(10|[1-9])\s*\|' "$F"); [ "$N" -ge 10 ] || { echo "❌ 判定不足 10 条（当前 $N）"; exit 1; }
V=$(grep -cE '保留|下线|合并' "$F"); [ "$V" -ge 10 ] || { echo "❌ 判定词需为 保留/下线/合并"; exit 1; }
grep -qE '规则|标准' "$F" || { echo "❌ 文首需先写判定规则"; exit 1; }
echo "✅ 判定齐全 → 与评审团基准比对定 🟢"
