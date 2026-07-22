# c1-09 Secret 泄漏体验与拦截              ⏱ 20min | 能力域 8 | 判题 CI

## 背景
AI 生成/补全代码时最容易顺手把密钥写死。安全红线第一条：**任何密钥不进 Git**。本关先"踩雷"再装"地雷探测器"。

## 任务
1. 运行 `sh .verify/scan.sh` —— 会在 starter/ 扫出一枚硬编码密钥
2. 整改：密钥改为环境变量读取（`os.environ`），新增 `.env.example`（只放变量名），`.gitignore` 加入 `.env`
3. 在本目录添加 `pre-commit.sh`：内容为提交前先跑一遍 scan（把探测器装进流程）

## 判题
- 🟡 CI：scan 结果为 0 命中 + config 使用 os.environ + .env.example 与 pre-commit.sh 存在
- 🟢 教练抽查：解释为什么"删掉再提交"不够（Git 历史仍在，需换钥/清历史）

## 提交方式
分支 `camp/c1-09/<工号>`
