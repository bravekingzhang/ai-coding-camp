#!/bin/sh
set -e
cd "$(dirname "$0")/.."
grep -qE 'PyYAML(>=|==)6' starter/requirements.txt || { echo "❌ 依赖仍是老版本，升级到 >=6.0"; exit 1; }
grep -q 'safe_load' starter/loader.py || { echo "❌ 应使用 yaml.safe_load"; exit 1; }
if grep -E 'yaml\.load\(' starter/loader.py | grep -v safe_load | grep -vq Loader; then echo "❌ 仍存在不受限的 yaml.load("; exit 1; fi
F=security-note.md
[ -f "$F" ] || { echo "❌ 缺少 security-note.md"; exit 1; }
grep -qE 'CI|拦截|扫描' "$F" || { echo "❌ note 需包含 CI 自动拦截思路"; exit 1; }
echo "✅ 安全基线整改完成"
