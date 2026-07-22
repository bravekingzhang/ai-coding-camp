#!/bin/sh
set -e
cd "$(dirname "$0")/.."
[ -f mcp-config.json ] || { echo "❌ 缺少 mcp-config.json"; exit 1; }
python3 -m json.tool mcp-config.json > /dev/null 2>&1 || { echo "❌ mcp-config.json 不是合法 JSON"; exit 1; }
grep -q 'server-filesystem' mcp-config.json || { echo "❌ 应使用 filesystem MCP server"; exit 1; }
F=transcript.md
[ -f "$F" ] || { echo "❌ 缺少 transcript.md"; exit 1; }
grep -q '来源' "$F" || { echo "❌ 回答必须标注来源"; exit 1; }
grep -q 'error-codes.md' "$F" || { echo "❌ 来源应指向 error-codes.md"; exit 1; }
grep -q '41' "$F" || { echo "❌ 回答内容未体现文档事实（41xxx）"; exit 1; }
echo "✅ 企业知识已接入且可溯源"
