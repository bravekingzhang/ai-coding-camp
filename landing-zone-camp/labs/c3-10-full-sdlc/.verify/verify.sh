#!/bin/sh
set -e
cd "$(dirname "$0")/.."
F=pipeline.md
[ -f "$F" ] || { echo "❌ 缺少 pipeline.md"; exit 1; }
DONE=$(grep -c '\[x\]' "$F"); [ "$DONE" -ge 8 ] || { echo "❌ 检查项完成 $DONE/8"; exit 1; }
grep -q '回滚' "$F" || { echo "❌ 缺少回滚预案"; exit 1; }
grep -q '监控' "$F" || { echo "❌ 发布单需含监控指标"; exit 1; }
grep -qE 'http|\.md|/' "$F" || { echo "❌ 各项需附产物链接/路径"; exit 1; }
echo "✅ 全链路走通，C3 关卡收官"
