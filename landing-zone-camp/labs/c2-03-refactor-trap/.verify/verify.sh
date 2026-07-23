#!/bin/sh
set -e
cd "$(dirname "$0")/.."
F=verdict.md
[ -f "$F" ] || { echo "❌ 缺少 verdict.md"; exit 1; }
# 精确匹配 L1（词边界，防止 L10/L11/不是L1 等子串蒙混）
grep -qE '\bL1\b|判定.*L1[^0-9]|应走 ?L1[^0-9]|为 ?L1[^0-9]|是 ?L1[^0-9]' "$F" || { echo "❌ 判定错误：这不是 L0（提示：对比排序参数，应判定为 L1）"; exit 1; }
# 排除"不是L1"这类否定表述
grep -qE '不是 ?L1|不应.{0,4}L1|并非 ?L1' "$F" && { echo "❌ 判定方向错误：该 diff 是 L1 而非 L0"; exit 1; }
grep -qE "reverse|倒序|降序|排序方向|升序变降序" "$F" || { echo "❌ 未指出具体行为变更点（提示：排序方向从升序变成了什么？）"; exit 1; }
grep -q "WHEN.*THEN" "$F" || { echo "❌ 缺少补写的 WHEN/THEN"; exit 1; }
echo "✅ 伪重构识破，越级已拦截"
