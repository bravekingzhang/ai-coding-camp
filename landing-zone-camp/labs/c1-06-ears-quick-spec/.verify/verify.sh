#!/bin/sh
set -e
cd "$(dirname "$0")/.."
F=quick-spec.md
[ -f "$F" ] || { echo "❌ 缺少 quick-spec.md"; exit 1; }
for sec in "问题" "验收条件" "影响范围" "测试要点"; do grep -q "$sec" "$F" || { echo "❌ 缺少小节: $sec"; exit 1; }; done
N=$(grep -c 'WHEN.*THEN' "$F"); [ "$N" -ge 3 ] || { echo "❌ EARS 句式不足 3 条（当前 $N）"; exit 1; }
echo "✅ 结构合格，进入 LLM rubric 预评"
