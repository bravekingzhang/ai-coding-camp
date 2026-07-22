#!/bin/sh
set -e
cd "$(dirname "$0")/.."
F=anatomy.md
[ -f "$F" ] || { echo "❌ 缺少 anatomy.md"; exit 1; }
for sec in "## frontmatter" "## 触发时机" "## 步骤" "## 反例" "## 边界" "## 维护信息"; do
  grep -q "$sec" "$F" || { echo "❌ 缺少小节: $sec"; exit 1; }
done
SIZE=$(wc -c < "$F"); [ "$SIZE" -ge 900 ] || { echo "❌ 每节需回答两问，当前内容过短($SIZE 字节)"; exit 1; }
echo "✅ 解剖完成"
