#!/bin/sh
set -e
cd "$(dirname "$0")/.."
F=loadcheck.md
[ -f "$F" ] || { echo "❌ 缺少 loadcheck.md（从 starter/ 复制模板）"; exit 1; }
# 防糊弄：不能只堆三个英文单词。要求 code/message/data 以 JSON 或伪 JSON 结构出现（三段式返回体）
# 接受格式："code": 0 / code: 0 / "code":"xxx" 等键值对形式
if ! grep -qE '"code"[[:space:]]*:|code[[:space:]]*:[[:space:]]*[0-9]' "$F"; then
  echo "❌ 未发现三段式返回体的 code 字段（规则可能未加载生效）"
  echo "   提示：生成结果应以 JSON 形式体现 code/message/data 三段，如 {\"code\": 0, \"message\": \"ok\", \"data\": {...}}"
  exit 1
fi
if ! grep -qE '"message"[[:space:]]*:|message[[:space:]]*:' "$F"; then
  echo "❌ 未发现三段式返回体的 message 字段"; exit 1
fi
if ! grep -qE '"data"[[:space:]]*:|data[[:space:]]*:' "$F"; then
  echo "❌ 未发现三段式返回体的 data 字段"; exit 1
fi
grep -q "工具配置证据" "$F" || { echo "❌ 缺少「工具配置证据」小节"; exit 1; }
# 有效内容不能太少（防止只写一行 JSON）
LINES=$(grep -vcE '^\s*(#|```|（|$)' "$F" || true)
[ "$LINES" -ge 5 ] || { echo "❌ 内容过少（当前有效行 $LINES），请如实记录工具加载规则的过程与证据"; exit 1; }
echo "✅ 规则已被工具加载并作用于生成结果"
