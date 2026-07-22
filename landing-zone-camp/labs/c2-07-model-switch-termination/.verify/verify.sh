#!/bin/sh
set -e
cd "$(dirname "$0")/.."
F=review-log.md
[ -f "$F" ] || { echo "❌ 缺少 review-log.md"; exit 1; }
for sec in "## 第一轮" "## 第二轮" "## 终止判定"; do grep -q "$sec" "$F" || { echo "❌ 缺少小节: $sec"; exit 1; }; done
grep -qE "真问题" "$F" || { echo "❌ 第二轮需按 真问题/风格偏好/误报 分类"; exit 1; }
grep -qE "风格偏好|误报" "$F" || { echo "❌ 第二轮需按 真问题/风格偏好/误报 分类"; exit 1; }
C=$(grep -cE "①|②|③|条件[123一二三]" "$F"); [ "$C" -ge 3 ] || { echo "❌ 终止判定需逐条对照三个条件"; exit 1; }
grep -qE "收敛|终止|通过" "$F" || { echo "❌ 缺少明确结论"; exit 1; }
echo "✅ 审查已在约定条件下收敛"
