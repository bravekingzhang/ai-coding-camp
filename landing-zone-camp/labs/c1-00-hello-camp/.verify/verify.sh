#!/bin/sh
# c1-00 判题：hello.md 三要素齐全。失败时给出中文指路，不裸报错。
set -e
cd "$(dirname "$0")/.."
F=hello.md
if [ ! -f "$F" ]; then
  echo "❌ 缺少 hello.md：请在 labs/c1-00-hello-camp/ 目录下创建它（内容三行：工号/姓名/一句话）"
  echo "   提示：详见本关 README 第 5 步。"
  exit 1
fi

# 工号行：匹配 "工号:" 或 "工号：" ，冒号+可选空格后需有非空内容
EMP=$(grep -E '^工号:[[:space:]]*[^[:space:]]' "$F" | head -1)
EMP2=$(grep -E '^工号：[[:space:]]*[^[:space:]]' "$F" | head -1)
if [ -z "$EMP" ] && [ -z "$EMP2" ]; then
  echo "❌ hello.md 缺少有效的「工号:」行（冒号后要填你的工号，不能为空）"
  exit 1
fi

# 姓名行
NAME=$(grep -E '^姓名:[[:space:]]*[^[:space:]]' "$F" | head -1)
NAME2=$(grep -E '^姓名：[[:space:]]*[^[:space:]]' "$F" | head -1)
if [ -z "$NAME" ] && [ -z "$NAME2" ]; then
  echo "❌ hello.md 缺少有效的「姓名:」行（冒号后要填你的姓名，不能为空）"
  exit 1
fi

# 有效行：去掉空行和注释行后 ≥3
LINES=$(grep -vcE '^\s*$' "$F" || true)
if [ "$LINES" -lt 3 ]; then
  echo "❌ hello.md 内容过少（当前有效行 $LINES，需 ≥3）：请补全工号、姓名、一句话三行"
  exit 1
fi

echo "✅ hello.md 三要素齐全，c1-00 通过"
