from dataclasses import dataclass


@dataclass
class Order:
    id: int
    user_id: int
    amount_fen: int   # 金额单位：分（避免浮点误差，团队铁律）
    status: str       # CREATED / PAID / CANCELLED


@dataclass
class Coupon:
    """优惠券。P1 项目要在订单服务里新增这个模块。

    - discount_fen：满减金额，单位同样用分
    - min_amount_fen：订单金额（分）需 ≥ 该值才能用券
    - expire_ts：过期时间戳；恰好等于当前时间视为未过期（< 才过期）
    """
    id: int
    discount_fen: int
    min_amount_fen: int
    expire_ts: int


# 内存存储（训练用，不接真实 DB）
ORDERS: dict = {}
COUPONS: dict = {}
