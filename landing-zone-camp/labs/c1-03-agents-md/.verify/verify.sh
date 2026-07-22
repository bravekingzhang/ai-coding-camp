#!/bin/sh
set -e
cd "$(dirname "$0")/.."
F=AGENTS.md
[ -f "$F" ] || { echo "❌ 缺少 AGENTS.md"; exit 1; }
for sec in "项目概述" "技术栈" "目录结构" "编码约定" "禁止事项" "常用命令"; do
  grep -q "$sec" "$F" || { echo "❌ 缺少小节: $sec"; exit 1; }
done
SIZE=$(wc -c < "$F"); [ "$SIZE" -ge 800 ] || { echo "❌ 内容过短($SIZE 字节)，AI 读了也白读"; exit 1; }
echo "✅ AGENTS.md 结构完整"
