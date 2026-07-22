#!/bin/sh
set -e
cd "$(dirname "$0")/.."
F=pr-note.md
[ -f "$F" ] || { echo "❌ 缺少 pr-note.md"; exit 1; }
for sec in "改动摘要" "Spec 级别" "自查清单"; do grep -q "$sec" "$F" || { echo "❌ 缺少小节: $sec"; exit 1; }; done
MSGS=$(git log --format=%B -n 10 2>/dev/null || echo "")
echo "$MSGS" | grep -qE '^(feat|fix|docs|refactor|chore|test)\([a-zA-Z0-9_-]+\): .+' || { echo "❌ 最近提交无 type(scope): 摘要 格式"; exit 1; }
echo "$MSGS" | grep -q 'Spec:' || { echo "❌ 提交正文缺少 Spec: 行"; exit 1; }
echo "✅ 合规 PR 达成，等待跨组 Review"
