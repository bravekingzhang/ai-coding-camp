"""迷你订单服务（训练用）。金额一律用"分"(int) 存储，避免浮点误差。"""
from models import Order, ORDERS

def create_order(user_id: int, amount_fen: int) -> dict:
    if amount_fen <= 0:
        return {"code": 40001, "message": "amount must be positive", "data": None}
    order = Order(id=len(ORDERS) + 1, user_id=user_id, amount_fen=amount_fen, status="CREATED")
    ORDERS[order.id] = order
    return {"code": 0, "message": "ok", "data": order.__dict__}

def get_order(order_id: int) -> dict:
    order = ORDERS.get(order_id)
    if order is None:
        return {"code": 40401, "message": "order not found", "data": None}
    return {"code": 0, "message": "ok", "data": order.__dict__}
