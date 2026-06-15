import unittest
from app.main import clean_tokens, get_frequencies, naive_overuse

class TestNaiveOveruse(unittest.TestCase):
    def test_clean_tokens(self):
        # Case conversion and basic splitting
        text = "Hello world"
        self.assertEqual(clean_tokens(text), ["hello", "world"])
        
        # Punctuation stripping
        text_with_punct = "Hello, world! This... is a test; indeed."
        expected = ["hello", "world", "this", "is", "a", "test", "indeed"]
        self.assertEqual(clean_tokens(text_with_punct), expected)

    def test_get_frequencies(self):
        tokens = ["apple", "banana", "apple", "cherry", "banana", "apple"]
        expected = {
            "apple": 3,
            "banana": 2,
            "cherry": 1
        }
        self.assertEqual(get_frequencies(tokens), expected)

    def test_naive_overuse_filtering(self):
        # Case where words are only used once should be filtered out
        counts = {
            "apple": 1,
            "banana": 1,
            "cherry": 1
        }
        # Since counts are all 1, they are not > 1.
        self.assertEqual(naive_overuse(counts), [])

        # Case where word frequency is below threshold
        # If len(counts) is 41, threshold is 41 * 0.05 = 2.05
        # A word with count = 2 is > 1 but < 2.05, so it is filtered.
        counts_large = {f"word{i}": 1 for i in range(40)}
        counts_large["apple"] = 2
        # len(counts_large) is 41. threshold = 2.05. "apple" has 2, which is < 2.05.
        self.assertEqual(naive_overuse(counts_large), [])

        # Case where word frequency meets/exceeds threshold
        # If len(counts) is 20, threshold is 20 * 0.05 = 1.0.
        # "apple" count 2 is > 1 and >= 1.0, so it should be included.
        counts_medium = {f"word{i}": 1 for i in range(19)}
        counts_medium["apple"] = 2
        # len(counts_medium) is 20. threshold = 1.0. "apple" has 2.
        self.assertEqual(naive_overuse(counts_medium), [("apple", 2)])

    def test_naive_overuse_ranking(self):
        # Check sorting order (descending by count)
        counts = {
            "apple": 2,
            "banana": 4,
            "cherry": 3,
            "date": 1
        }
        # len(counts) is 4. threshold is 4 * 0.05 = 0.2.
        # "apple" (2), "banana" (4), "cherry" (3) all qualify.
        # "date" (1) does not qualify (count is not > 1).
        # Expected ranking: banana (4), cherry (3), apple (2)
        expected = [
            ("banana", 4),
            ("cherry", 3),
            ("apple", 2)
        ]
        self.assertEqual(naive_overuse(counts), expected)

if __name__ == "__main__":
    unittest.main()
