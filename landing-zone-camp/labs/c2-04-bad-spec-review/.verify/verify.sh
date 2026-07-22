#!/bin/sh
set -e
cd "$(dirname "$0")/.."
F=findings.md
[ -f "$F" ] || { echo "❌ 缺少 findings.md"; exit 1; }
N=$(grep -cE '^[1-8][\.、:：]' "$F"); [ "$N" -ge 6 ] || { echo "❌ 编号发现不足 6 条（当前 $N），继续挖"; exit 1; }
[ -f rewrite.md ] || { echo "❌ 缺少 rewrite.md（任选 3 处改写）"; exit 1; }
grep -q 'WHEN.*THEN' rewrite.md || { echo "❌ 改写应给出可测的 WHEN/THEN"; exit 1; }
echo "✅ 结构达标 → LLM 按缺陷清单比对命中数"
