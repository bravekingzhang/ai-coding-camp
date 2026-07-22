#!/bin/sh
set -e
cd "$(dirname "$0")/.."
F=context-map.yaml
[ -f "$F" ] || { echo "❌ 缺少 context-map.yaml"; exit 1; }
M=$(grep -c 'match:' "$F"); [ "$M" -ge 3 ] || { echo "❌ match 规则不足 3 条（当前 $M）"; exit 1; }
R=$(grep -o 'rules/[^"]*\.md' "$F" | sort -u | wc -l); [ "$R" -ge 3 ] || { echo "❌ 引用的 rules 文件不足 3 个（当前 $R）"; exit 1; }
W=$(grep -c 'why:' "$F"); [ "$W" -ge 3 ] || { echo "❌ 每条规则都要写 why（当前 $W）"; exit 1; }
echo "✅ context-map 结构合格"
