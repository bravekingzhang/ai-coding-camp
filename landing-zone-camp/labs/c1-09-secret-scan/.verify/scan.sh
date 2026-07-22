#!/bin/sh
# 极简 Secret 扫描器（训练用）：命中输出并返回非 0
cd "$(dirname "$0")/.."
HITS=$(grep -RInE "(sk-[A-Za-z0-9-]{16,}|AKIA[A-Z0-9]{12,}|ghp_[A-Za-z0-9]{20,})" starter/ src/ 2>/dev/null | grep -v 'env.example' || true)
if [ -n "$HITS" ]; then echo "发现疑似密钥："; echo "$HITS"; exit 1; fi
echo "✅ 未发现硬编码密钥"
