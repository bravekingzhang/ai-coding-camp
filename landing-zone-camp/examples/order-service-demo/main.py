"""迷你订单服务（P1 起步脚手架）。

团队约定（务必遵守，AI 生成新代码也要一致）：
- 金额一律用「分」(int) 存储，避免浮点误差。
- 所有接口统一返回三段式：{"code": 0, "message": "ok", "data": ...}，失败 code 非 0。

P1 毕业项目的默认题：在此基础上新增「优惠券模块」，让订单能在下单时核销一张券。
优惠券的字段已定义在 models.Coupon，本文件留出 TODO 标记了你要扩展的位置。
"""
import time

from models import Order, Coupon, ORDERS, COUPONS


def create_order(user_id: int, amount_fen: int) -> dict:
    """创建订单。amount_fen 为分，必须 > 0。"""
    if amount_fen <= 0:
        return {"code": 40001, "message": "amount must be positive", "data": None}
    order = Order(id=len(ORDERS) + 1, user_id=user_id, amount_fen=amount_fen, status="CREATED")
    ORDERS[order.id] = order
    return {"code": 0, "message": "ok", "data": _dump(order)}


def get_order(order_id: int) -> dict:
    """查询订单。不存在返回 40401。"""
    order = ORDERS.get(order_id)
    if order is None:
        return {"code": 40401, "message": "order not found", "data": None}
    return {"code": 0, "message": "ok", "data": _dump(order)}


# ────────────────────────────────────────────────────────────
# 优惠券模块（P1 默认题的起点）
#
# 1) create_coupon：登记一张券
# 2) apply_coupon(order_id, coupon_id)：给订单核销一张券
#    要求覆盖以下验收条件（用 EARS 句式）：
#      - WHEN 订单金额 ≥ 券门槛且券未过期 THEN 成功核销，订单按 discount_fen 抵扣
#      - WHEN 订单金额 < 券门槛 THEN 返回 40002，券不变
#      - WHEN 券已过期（expire_ts < 当前时间戳）THEN 返回 40003
#      - WHEN 同一订单重复核销 THEN 返回 40004（幂等保护）
# ────────────────────────────────────────────────────────────

def create_coupon(discount_fen: int, min_amount_fen: int, expire_ts: int) -> dict:
    """登记一张优惠券。"""
    coupon = Coupon(id=len(COUPONS) + 1, discount_fen=discount_fen,
                    min_amount_fen=min_amount_fen, expire_ts=expire_ts)
    COUPONS[coupon.id] = coupon
    return {"code": 0, "message": "ok", "data": _dump(coupon)}


def apply_coupon(order_id: int, coupon_id: int) -> dict:
    """给订单核销一张券。

    TODO（P1 任务）：实现完整的核销逻辑。当前是占位实现，仅做最小校验，
    你需要补齐门槛/过期/重复核销等分支，并让 tests/test_orders_basic.py 里
    被跳过的用例转绿（参考 c2-08 的「从 AC 生成测试」方法）。
    """
    order = ORDERS.get(order_id)
    if order is None:
        return {"code": 40401, "message": "order not found", "data": None}
    coupon = COUPONS.get(coupon_id)
    if coupon is None:
        return {"code": 40402, "message": "coupon not found", "data": None}
    # TODO: 补齐门槛、过期、幂等校验与金额抵扣
    return {"code": 0, "message": "ok", "data": _dump(order)}


def _dump(obj) -> dict:
    return obj.__dict__.copy()
