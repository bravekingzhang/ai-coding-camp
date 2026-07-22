#!/bin/sh
# 用法: check-answers.sh <学员答案文件> <标准答案sha256>
# 归一化: 去空格 → 转大写 → 仅保留 "N:Lx" 行 → 按题号排序
set -e
FILE="$1"; EXPECT="$2"
[ -f "$FILE" ] || { echo "❌ 未找到答案文件 $FILE"; exit 1; }
GOT=$(tr -d ' \t\r' < "$FILE" | tr 'a-z' 'A-Z' | grep -E '^[0-9]+:L[0-9]$' | sort -t: -k1,1n | sha256sum | cut -d' ' -f1)
if [ "$GOT" = "$EXPECT" ]; then
  echo "✅ 全部正确"
else
  echo "❌ 答案不完全正确（提示：逐题回到决策树重新判定，格式为每行 N:Lx）"
  exit 1
fi
