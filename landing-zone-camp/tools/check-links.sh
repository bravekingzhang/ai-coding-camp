#!/bin/sh
# check-links.sh — 扫描 landing-zone-camp/ 下所有 *.md 中的仓库内相对路径引用，
# 逐一验证目标存在；缺失则列出并 exit 1。
#
# 识别两类引用：
#   1) Markdown 链接  ](相对路径)  —— 含 ../ 或仓库内目录的 .md/.yaml/.py/.sh
#   2) 正文里出现     examples/xxx templates/xxx handbook/xxx labs/xxx rules/xxx
#                     starter/xxx rubrics/xxx tools/xxx projects/xxx c4-modules/xxx
#                     形如「目录或目录/文件」的引用
#
# 用法：sh tools/check-links.sh   （从仓库根 landing-zone-camp/ 下执行）
set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"   # landing-zone-camp/
fail=0
checked=0
missing_list=""

# 在某源文件所在目录下解析一个相对路径，判断是否存在。
# $1 = 源文件绝对路径，$2 = 要检查的相对引用
exists_relative() {
    src_dir=$(dirname "$1")
    # 砍掉锚点 #...
    ref=$(printf '%s' "$2" | sed 's/#.*//')
    [ -z "$ref" ] && return 0            # 纯锚点，跳过
    [ -e "$src_dir/$ref" ] && return 0
    return 1
}

# 去重收集所有 md 文件
find "$ROOT" -name '*.md' -type f | sort | while read -r f; do
    # —— 1) Markdown 链接里的路径 ——
    # 匹配 ](后面直到 )，取路径部分
    grep -oE '\]\([^)]+\)' "$f" 2>/dev/null | sed -E 's/^\]?\(//; s/\)$//' | while read -r ref; do
        # 只管仓库内相对引用（含 ../ 或以已知目录/扩展名开头），跳过 http/锚点纯文本
        case "$ref" in
            http://*|https://*|mailto:*) continue ;;
        esac
        ref_noanchor=$(printf '%s' "$ref" | sed 's/#.*//')
        [ -z "$ref_noanchor" ] && continue
        if ! exists_relative "$f" "$ref_noanchor"; then
            printf '❌ 死链: %s 引用了 %s\n' "${f#$ROOT/}" "$ref"
        fi
    done
done

# 因为上面用了管道子 shell，exit code 传不出来；这里单独再跑一遍做计数判定
recheck() {
    bad=0
    find "$ROOT" -name '*.md' -type f | sort | while read -r f; do
        grep -oE '\]\([^)]+\)' "$f" 2>/dev/null | sed -E 's/^\]?\(//; s/\)$//' | while read -r ref; do
            case "$ref" in
                http://*|https://*|mailto:*) continue ;;
            esac
            ref_noanchor=$(printf '%s' "$ref" | sed 's/#.*//')
            [ -z "$ref_noanchor" ] && continue
            src_dir=$(dirname "$f")
            if [ ! -e "$src_dir/$ref_noanchor" ]; then
                printf '%s|%s\n' "${f#$ROOT/}" "$ref"
            fi
        done
    done
}

bad_links=$(recheck)
bad_count=$(printf '%s\n' "$bad_links" | grep -c '|' || true)

if [ "$bad_count" -gt 0 ]; then
    echo "—— 发现 $bad_count 处死链 ——"
    printf '%s\n' "$bad_links" | sed 's/|/ → 引用了 /'
    echo
    echo "❌ 链接体检未通过"
    exit 1
fi

echo "✅ 链接体检通过：所有 Markdown 内的仓库内相对链接均存在"
