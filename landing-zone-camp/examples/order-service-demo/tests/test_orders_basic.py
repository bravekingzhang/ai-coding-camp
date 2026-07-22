"""order-service-demo 基础测试。

可直接运行：python3 tests/test_orders_basic.py
（用标准库 unittest，无需安装 pytest，便于在任何环境跑。）

注意：优惠券核销的核心用例目前用 @skip 标记 —— 它们对应 P1 任务待实现的功能。
你完成 P1 的 apply_coupon 后，应把这些 skip 去掉，让它们转绿。
这就是 c2-08「从验收条件生成测试用例」方法的实践。
"""
import sys
import os
import time
import unittest

# 让测试能 import 同级上一层目录的 main / models
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from models import ORDERS, COUPONS  # noqa: E402
import main  # noqa: E402


class TestCreateOrder(unittest.TestCase):
    def setUp(self):
        ORDERS.clear(); COUPONS.clear()

    def test_create_ok(self):
        r = main.create_order(user_id=1, amount_fen=9900)
        self.assertEqual(r["code"], 0)
        self.assertEqual(r["data"]["amount_fen"], 9900)
        self.assertEqual(r["data"]["status"], "CREATED")

    def test_create_non_positive_rejected(self):
        r = main.create_order(user_id=1, amount_fen=0)
        self.assertEqual(r["code"], 40001)
        self.assertIsNone(r["data"])

    def test_get_order_not_found(self):
        r = main.get_order(999)
        self.assertEqual(r["code"], 40401)

    def test_three_section_return_shape(self):
        """团队铁律：返回体永远是 code/message/data 三段式。"""
        r = main.create_order(user_id=1, amount_fen=100)
        self.assertEqual(set(r.keys()), {"code", "message", "data"})


class TestApplyCoupon(unittest.TestCase):
    def setUp(self):
        ORDERS.clear(); COUPONS.clear()
        self.now = int(time.time())

    @unittest.skip("P1 任务：实现门槛校验后去掉此 skip")
    def test_apply_below_threshold_rejected(self):
        """WHEN 订单金额 < 券门槛 THEN 返回 40002，券不变。"""
        main.create_order(user_id=1, amount_fen=500)               # 5 元
        main.create_coupon(discount_fen=1000, min_amount_fen=9900, expire_ts=self.now + 3600)
        r = main.apply_coupon(order_id=1, coupon_id=1)
        self.assertEqual(r["code"], 40002)

    @unittest.skip("P1 任务：实现过期校验后去掉此 skip")
    def test_apply_expired_rejected(self):
        """WHEN 券已过期（expire_ts < 当前时间戳）THEN 返回 40003。"""
        main.create_order(user_id=1, amount_fen=9900)
        main.create_coupon(discount_fen=1000, min_amount_fen=9900, expire_ts=self.now - 1)
        r = main.apply_coupon(order_id=1, coupon_id=1)
        self.assertEqual(r["code"], 40003)

    @unittest.skip("P1 任务：实现幂等保护后去掉此 skip")
    def test_apply_twice_rejected(self):
        """WHEN 同一订单重复核销 THEN 返回 40004（幂等）。"""
        main.create_order(user_id=1, amount_fen=9900)
        main.create_coupon(discount_fen=1000, min_amount_fen=9900, expire_ts=self.now + 3600)
        self.assertEqual(main.apply_coupon(1, 1)["code"], 0)
        r = main.apply_coupon(1, 1)
        self.assertEqual(r["code"], 40004)


if __name__ == "__main__":
    unittest.main(verbosity=2)
