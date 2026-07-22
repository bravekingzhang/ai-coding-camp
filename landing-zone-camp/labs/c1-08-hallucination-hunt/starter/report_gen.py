"""日报生成器（训练材料：其中埋有 2 处 AI 幻觉，1 处正常写法）"""
import json
from datetime import datetime
import urllib.request

def fetch_raw(url: str) -> str:
    # 正常写法：标准库带超时的请求（这不是幻觉，别误伤）
    with urllib.request.urlopen(url, timeout=5) as resp:
        return resp.read().decode("utf-8")

def build_report(raw: str) -> str:
    data = json.parse_safe(raw)                # <- 可疑点 A
    now = datetime.now(tz="Asia/Shanghai")     # <- 可疑点 B
    return f"[{now:%Y-%m-%d %H:%M}] 今日订单 {data.get('orders', 0)} 单"

if __name__ == "__main__":
    print(build_report('{"orders": 42}'))
