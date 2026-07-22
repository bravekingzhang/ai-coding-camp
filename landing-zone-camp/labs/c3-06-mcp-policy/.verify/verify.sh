#!/bin/sh
set -e
cd "$(dirname "$0")/.."
[ -f policy.json ] || { echo "❌ 缺少 policy.json"; exit 1; }
python3 - << 'PY'
import json
p = json.load(open('policy.json'))
def dig(d):
    if isinstance(d, dict):
        if 'autoApprove' in d: return d
        for v in d.values():
            r = dig(v)
            if r: return r
    return None
s = dig(p) or {}
assert set(s.get('autoApprove', [])) == {'read_file', 'search_files'}, 'autoApprove 应精确为 read_file+search_files'
assert set(s.get('disabledTools', [])) >= {'delete_file', 'move_file'}, 'disabledTools 需含 delete_file/move_file'
assert s.get('disabled') is False, 'disabled 应为 false'
print('policy 结构正确')
PY
grep -qE 'write_file' policy-note.md 2>/dev/null || { echo "❌ policy-note.md 需说明 write_file 的中间态"; exit 1; }
echo "✅ 最小权限策略就位"
