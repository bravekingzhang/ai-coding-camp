import os, sys, unittest
sys.path.insert(0, os.path.dirname(__file__))
from orders import summarize  # noqa: E402

BASE = 1_700_000_000

class TestSummarize(unittest.TestCase):
    def test_paid(self):
        o = {"id": 1, "status": "PAID", "created_at": BASE, "paid_at": BASE + 120}
        self.assertEqual(summarize(o, BASE + 999), "订单#1 [PAID] 历时2分钟")

    def test_created(self):
        o = {"id": 2, "status": "CREATED", "created_at": BASE, "paid_at": None}
        self.assertEqual(summarize(o, BASE + 300), "订单#2 [CREATED] 历时5分钟")

    # 在下方追加 CANCELLED 场景的回归测试（函数名需含 regression）

if __name__ == "__main__":
    unittest.main()
