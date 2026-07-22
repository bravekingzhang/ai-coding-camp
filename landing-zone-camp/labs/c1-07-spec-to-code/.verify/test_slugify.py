import os, sys, unittest
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))
from slugify import slugify  # noqa: E402

class TestSlugify(unittest.TestCase):
    def test_basic(self): self.assertEqual(slugify("Hello, World!"), "hello-world")
    def test_collapse(self): self.assertEqual(slugify("a   b,,c"), "a-b-c")
    def test_trim(self): self.assertEqual(slugify("--A_B--"), "a-b")
    def test_idempotent(self): self.assertEqual(slugify("already-slug"), "already-slug")
    def test_empty(self): self.assertEqual(slugify(""), "")
    def test_all_punct(self): self.assertEqual(slugify("!!! ??"), "")

if __name__ == "__main__":
    unittest.main()
