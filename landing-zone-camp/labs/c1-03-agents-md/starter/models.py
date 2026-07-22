from dataclasses import dataclass

@dataclass
class Order:
    id: int
    user_id: int
    amount_fen: int   # 金额单位：分
    status: str       # CREATED / PAID / CANCELLED

ORDERS: dict = {}
