#!/bin/sh
set -e
cd "$(dirname "$0")/.."
F=skillhub-log.md
[ -f "$F" ] || { echo "❌ 缺少 skillhub-log.md"; exit 1; }
for sec in "上传" "审批" "发布" "1.0.1" "安装"; do grep -q "$sec" "$F" || { echo "❌ 缺少环节记录: $sec"; exit 1; }; done
echo "✅ 五步留痕，待教练对照 SkillHub 审计日志核实"
