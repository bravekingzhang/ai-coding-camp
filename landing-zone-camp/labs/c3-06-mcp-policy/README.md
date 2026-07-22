# c3-06 MCP 权限与工具白名单配置            ⏱ 20min | 能力域 12 | 判题 CI

## 背景
MCP 能力越强越要收口：autoApprove 只放只读、写操作必须人批、危险工具直接禁用 —— 这是企业策略管控的最小单元。

## 任务
基于 c3-05 的配置写 `policy.json`（单个 server 的策略段）：
`autoApprove` 仅含 `read_file` 与 `search_files`；`disabledTools` 含 `delete_file` 与 `move_file`；`disabled: false`。
另写 `policy-note.md` 一段话：为什么 write_file 既不在 autoApprove 也不在 disabled（走人工确认的中间态）。

## 判题
- 🟡 CI：JSON 合法 + 白名单/黑名单精确匹配 + note 说明中间态
- 🟢 教练抽查：口述三层策略继承（Enterprise > Organization > User）在此如何落位

## 提交方式
分支 `camp/c3-06/<工号>`
