# 判题脚本待修清单（spec 范围外 · 仅供后续单独处理）

> 本文件由训练系统评审产出，记录 `labs/*/.verify/verify.sh` 层面的设计缺陷。
> 本次优化（内容解耦 + 管理端 + 体验修整）严格不触碰判题脚本语义，故归档于此，留待独立排期。

## 一、判题"造假"（最严重的诚信问题）

以下关卡 README 标榜"LLM rubric 预评"，verify.sh 却从未调用任何 LLM / API / 评分脚本，只是 echo 一句假话：

| 关卡 | verify.sh 的假输出 |
|------|-------------------|
| c2-02 写 L2 Spec | `✅ 结构合格 → LLM rubric 预评 → 跨组评审已指派`（rubrics/spec-quality.yaml 从未被读取） |
| c2-04 给坏 Spec 挑刺 | `✅ 结构达标 → LLM 按缺陷清单比对命中数`（只数了 6 行编号） |
| c2-05 跨组互评 | `✅ 反思已提交`（责任甩给平台，CI 自己什么都没验） |

**建议修复方向**：让 verify 通过平台 API 把产物投递到 worker 的 `grade-llm` 队列，由 worker 按 `rubrics/*.yaml` 真实评分后回写；或至少删除"假通过"措辞，明确标注"🟡 待 LLM/教练复核"。

## 二、判题可被零成本糊弄（grep 子串 / 文件非空 = 通过）

| 关卡 | 漏洞 | 实测复现 |
|------|------|---------|
| c1-02 | `grep -qi "code"/"message"/"data"` 全文匹配 | 一行 `# code message data` 即过全部检查 |
| c1-03 | 只查六个小节标题 + `wc -c >= 800` | 800 字节废话凑满即过 |
| c1-04 | `why:`/`match:` 全局计数，不与条目绑定 | 三条孤立 why + 三条无关 match 即过 |
| c1-06 | WHEN/THEN 单行计数；不区分正常/异常流 | 三条全正常 WHEN/THEN 即过 |
| c1-08 | 只 grep `parse_safe`/`tz`，四列格式不校验 | `parse_safe|乱写|乱写|乱写` 即过 |
| c1-09 | `pre-commit.sh` 只 grep `scan` | 内容仅为单词 `scan` 的空壳文件即过；连可执行位都没查 |
| c1-10 | 两次 grep 可命中不同 commit；不校验真实改动 | 历史里有任意一条格式 commit 即过 |
| c2-03 | `grep -q "L1"` 子串匹配 | 写 `L10` 或 `不是L1`（答案相反）都能过 |
| c2-06 | 四标题 + 四关键词（含 `11` 这种无效词）即过 | 不查"行号/问题/后果/修法"格式 |
| c2-07 | 标题 + 序号 + 结论词即过；序号计数未限定小节 | 一行实质内容都没有也通过 |
| c2-08 | `python3 tests/test_coupon.py` 空跑 pytest 文件 | 6 个无断言空函数 = "测试全绿"（exit 0） |
| c2-09 | 只求测试函数名含 `regression` | 不修 bug，复制 PAID 测试改名即过 |
| c3-01 | 六标题 + `wc -c >= 900` | 废话凑 900 字节即过 |
| c3-02 | `grep 游标/WHERE id`（原文素材里就有） | 复制 starter 原文即过 |
| c3-04 | 判定词全文计数，不绑定判定行 | 规则段堆次数即过 |
| c3-05 | transcript 可手伪造 | 手抄 docs + 一句含 `41` 即过 |
| c3-07 | 文件名 + `-` 开头行数 ≥3 | 三行 `- xxx` 毫无意义也过 |
| c3-08 | `python3` 空跑；docstring 已写明答案；grep `20` 误匹配广 | 空壳函数 + 抄 docstring 即过 |
| c3-09 | `grep 方案` ≥2、含 `AC` 两字母 | 纯关键词 |
| c3-10 | 8 个 `[x]` + 回滚/监控各一次 | 纯手写 checklist 即过 |

## 三、题目本身的 bug

- **c1-08 幻觉猎杀**：README 要求"运行 report_gen.py 验证判断"，但第 12 行 `json.parse_safe` 先抛错，第 13 行的 `tz` 错误**运行时不可达**，只能看到 1 处。措辞与运行行为矛盾。
- **c2-01 答案主观却哈希比对**：多题（如 Q5/Q11/Q18）在真实工程里答案不唯一，题目未给分级阈值却用 SHA 硬判对错。

## 四、环境不可移植

- **`tools/check-answers.sh`** 用了 GNU 专有的 `sha256sum`，macOS（BSD）默认没有。c1-05、c2-01 两个 quiz 关卡在 Mac 上本地预跑会 `command not found`。建议改 `shasum -a 256` 或加平台判断。

> 注：本次 Phase 1 已将 spec-levels.md 的分级规则逐条补齐（见 handbook/spec-levels.md），间接缓解了 c2-01"学员没有判分依据"的体验问题，但 SHA 比对与主观答案的内在矛盾仍属本清单范围。
