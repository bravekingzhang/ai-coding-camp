#!/bin/sh
set -e
cd "$(dirname "$0")/.."
F=findings.md
[ -f "$F" ] || { echo "❌ 缺少 findings.md"; exit 1; }
grep -q 'parse_safe' "$F" || { echo "❌ 有一处幻觉未被发现（提示：json 模块的方法名，逐个对照官方文档）"; exit 1; }
grep -q 'tz' "$F" || { echo "❌ 有一处幻觉未被发现（提示：datetime.now 的参数类型）"; exit 1; }
if grep 'urlopen' "$F" | grep -qE '幻觉|不存在|错误'; then
  echo "❌ 误伤：urllib.request.urlopen(timeout=...) 是正常写法"; exit 1
fi
echo "✅ 两处幻觉全部命中且无误伤"
