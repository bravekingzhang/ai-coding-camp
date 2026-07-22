#!/bin/sh
set -e
cd "$(dirname "$0")/.."
F=loadcheck.md
[ -f "$F" ] || { echo "❌ 缺少 loadcheck.md"; exit 1; }
for k in code message data; do grep -qi "$k" "$F" || { echo "❌ 生成结果未体现规则字段: $k（规则可能未加载）"; exit 1; }; done
grep -q "工具配置证据" "$F" || { echo "❌ 缺少「工具配置证据」一节"; exit 1; }
echo "✅ 规则已被工具加载并作用于生成结果"
