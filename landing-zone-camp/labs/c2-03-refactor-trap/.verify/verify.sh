#!/bin/sh
set -e
cd "$(dirname "$0")/.."
F=verdict.md
[ -f "$F" ] || { echo "❌ 缺少 verdict.md"; exit 1; }
grep -q "L1" "$F" || { echo "❌ 判定错误：这不是 L0（提示：对比排序参数）"; exit 1; }
grep -qE "reverse|倒序|降序|排序方向" "$F" || { echo "❌ 未指出具体行为变更点"; exit 1; }
grep -q "WHEN.*THEN" "$F" || { echo "❌ 缺少补写的 WHEN/THEN"; exit 1; }
echo "✅ 伪重构识破，越级已拦截"
