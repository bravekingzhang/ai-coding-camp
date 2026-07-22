# 营员手册

> 训练营的全部"共同语言"集中在这本手册里。题目里出现的手册链接，都指向下面这些页。

## 目录

| 页 | 内容 |
|----|------|
| [spec-levels.md](spec-levels.md) | Spec 四级分级标准（L0/L1/L2/L3）+ 决策树 + EARS 句式 |
| [grading.md](grading.md) | 判题机制：三色含义、🟡 与 🟢 怎么来、如何本地预跑 |
| [methods.md](methods.md) | 四个方法：Bugfix 三层描述法、复杂任务四阶段、AI 审查终止三条件、context-map |
| [review-checklist.md](review-checklist.md) | Spec 评审四项 + 代码四维审查清单 |
| [skill-guide.md](skill-guide.md) | 什么是 Skill / SKILL.md 六段结构 / 什么是 SkillHub |

模板：[L1 快速 Spec](../templates/l1-quick-spec.md) · [L2 标准 Spec](../templates/l2-standard-spec.md)

---

## 名词速查表

| 术语 | 一句话释义 | 详见 |
|------|-----------|------|
| **Spec** | 描述"要做什么、做到什么程度"的结构化文档，团队协作的接口格式 | [spec-levels](spec-levels.md) |
| **L0/L1/L2/L3** | Spec 的四个重量级，按改动半径递增 | [spec-levels](spec-levels.md) |
| **EARS** | 写验收条件的句式：WHEN…THEN…，保证可测 | [spec-levels](spec-levels.md#ears-句式写验收条件用) |
| **AC** | 验收条件（Acceptance Criteria），用 EARS 写 | [spec-levels](spec-levels.md) |
| **🟡 / 🟢 / 🔴** | 判题三色：通过 / 优秀 / 未过 | [grading](grading.md) |
| **context-map** | "改哪个路径 → 自动加载哪些规则"的映射文件 | [methods](methods.md#四context-map上下文映射文件) |
| **Skill** | 把踩坑经验写成"AI 和人都能照着做"的执行手册 | [skill-guide](skill-guide.md) |
| **SkillHub** | 企业内部技能资产平台，沉淀 / 审批 / 发布 / 安装 Skill | [skill-guide](skill-guide.md#什么是-skillhub) |
| **Rule** | 一条"必须 / 禁止"的短约定，机器可查 | [skill-guide](skill-guide.md#一句话区别) |
| **Detection** | 一条"如何被 CI / 扫描自动拦截"的规则 | [skill-guide](skill-guide.md#一句话区别) |
| **四维审查** | 从安全 / 正确性 / 性能 / 可维护性四个维度审代码 | [review-checklist](review-checklist.md) |
| **四阶段工作流** | 头脑风暴 → 写计划 → 分步实现 → 对照验收验证 | [methods](methods.md#二复杂任务四阶段工作流) |
| **终止三条件** | AI 审查何时该停的三个约定 | [methods](methods.md#三ai-审查终止三条件) |
| **AGENTS.md** | 写给 AI 工具看的项目说明文件，声明项目约定 | [spec-levels](spec-levels.md) |
| **部门工具登记表** | 平台「管理」页里登记各部门默认 AI 工具的表 | 平台管理页 |
| **P1/P2/P3** | 三个认证毕业项目（订单服务 / 从踩坑到资产 / 带教实战） | [../projects/](../projects/) |

---

## 部门默认工具

平台「管理 → 部门工具登记表」里登记了各部门默认使用的 AI 编码工具（如 A 部门用 Claude Code、B 部门用 Qoder）。各工具的配置方式有差异，但都遵循同一套加载逻辑：**项目的 `AGENTS.md` 是统一的约定入口，各工具会额外读取自己的规则目录**。具体配置请以平台登记表为准。
