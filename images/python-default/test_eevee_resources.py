import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from eevee_resources import resource_path


class ResourcePathTest(unittest.TestCase):
    def test_returns_uploaded_file(self):
        with tempfile.TemporaryDirectory() as directory:
            resource = Path(directory) / "data.csv"
            resource.write_text("value\n42\n")
            with patch("eevee_resources._RESOURCE_DIRECTORY", Path(directory)):
                self.assertEqual(resource_path("data.csv").read_text(), "value\n42\n")

    def test_rejects_missing_and_non_filename_paths(self):
        with tempfile.TemporaryDirectory() as directory:
            with patch("eevee_resources._RESOURCE_DIRECTORY", Path(directory)):
                with self.assertRaises(FileNotFoundError):
                    resource_path("missing.csv")
                for name in ("", ".", "..", "../data.csv", "nested/data.csv", r"nested\data.csv"):
                    with self.subTest(name=name), self.assertRaises(ValueError):
                        resource_path(name)


if __name__ == "__main__":
    unittest.main()
