# order-service-demo · P1 订单服务起步脚手架

C2 黄带毕业项目 [P1](../../projects/P1-order-service.md) 的默认起点。这是一个极简的订单服务，P1 任务是在此基础上新增「优惠券模块」。

## 怎么跑

依赖：仅 Python 3 标准库，无需安装任何包。

```sh
# 跑基础测试（订单 CRUD 部分应全绿，优惠券用例被 skip —— 那是你的任务）
python3 tests/test_orders_basic.py
```

预期：`TestCreateOrder` 4 个用例通过；`TestApplyCoupon` 3 个用例显示 skipped（它们对应你要实现的优惠券核销验收条件）。

## 项目结构

```
models.py                      数据模型（Order 已有；Coupon 字段已定义）
main.py                        服务入口（create_order / get_order 已实现；
                               create_coupon 已实现；apply_coupon 是 TODO 占位）
tests/test_orders_basic.py     基础测试（可直接 python3 运行，无需 pytest）
```

## 团队约定（写新代码必须遵守）

1. **金额一律用「分」(int) 存储**，禁止用 float（避免浮点误差）。`amount_fen` / `discount_fen` 都是分。
2. **返回体永远是三段式**：`{"code": 0, "message": "ok", "data": ...}`；失败时 code 非 0、data 为 None。
3. 错误码已分配的号段：`40001` 参数非法、`40401` 订单不存在、`40402` 券不存在。优惠券核销的错误码建议沿用 `40002~40004`（见 `main.py` 的验收条件注释）。

## P1 你要做什么

1. 先按 [L2 Spec 模板](../../templates/l2-standard-spec.md) 写一份优惠券模块的 Spec（这会被跨组评审）。
2. 实现 `main.apply_coupon`，补齐门槛 / 过期 / 幂等 / 金额抵扣逻辑。
3. 把 `tests/test_orders_basic.py` 里 3 个 `@skip` 去掉，让它们转绿；鼓励再加你自己的用例（参考 c2-08 方法）。
4. 走完四维 Review（参考 [handbook/review-checklist.md](../../handbook/review-checklist.md)）。

> 脚手架有意保持极简：内存存储、无网络、无框架。重点在 Spec 驱动开发与审查流程，不在业务复杂度。
