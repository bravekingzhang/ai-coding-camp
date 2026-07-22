#!/bin/sh
set -e
cd "$(dirname "$0")/.."
F=l2-spec.md
[ -f "$F" ] || { echo "❌ 缺少 l2-spec.md"; exit 1; }
for sec in "背景" "用户故事" "验收条件" "正常流程" "异常流程" "边界条件" "非功能需求" "依赖与影响范围"; do
  grep -q "$sec" "$F" || { echo "❌ 缺少小节: $sec"; exit 1; }
done
N=$(grep -c 'WHEN.*THEN' "$F"); [ "$N" -ge 6 ] || { echo "❌ EARS 验收条件不足 6 条（当前 $N）"; exit 1; }
for k in "性能" "安全" "幂等"; do grep -q "$k" "$F" || { echo "❌ 非功能需求缺少维度: $k"; exit 1; }; done
echo "✅ 结构合格 → LLM rubric 预评 → 跨组评审已指派"
