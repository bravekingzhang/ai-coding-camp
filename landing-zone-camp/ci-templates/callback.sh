#!/bin/sh
# 用法: callback.sh <lab> <empId> <red|yellow> <commit> <pipelineUrl>
# 依赖环境变量: CAMP_API, CAMP_CI_TOKEN
LAB="$1"; EMP="$2"; COLOR="$3"; COMMIT="$4"; URL="$5"
BODY=$(printf '{"lab":"%s","emp_id":"%s","commit":"%s","pipeline_url":"%s","result":"%s","checks":[{"name":"verify.sh","pass":%s}]}' \
  "$LAB" "$EMP" "$COMMIT" "$URL" "$COLOR" "$([ "$COLOR" = yellow ] && echo true || echo false)")
curl -sf -X POST "$CAMP_API/api/v1/grade/ci-callback" \
  -H "content-type: application/json" \
  -H "x-camp-token: $CAMP_CI_TOKEN" \
  -d "$BODY" || echo "⚠️ 回调失败，平台对账任务将在 30 分钟内告警"
