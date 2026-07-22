import yaml

def load_config(raw: str) -> dict:
    # 训练材料：不受限的反序列化写法，等你按安全红线整改
    return yaml.load(raw)
