import os
import subprocess
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT_WORKDIR = Path("/app")
SRC_PATH = ROOT_WORKDIR / "src"
TEST_PATH = ROOT_WORKDIR / "test"
PYTEST_RESULTS_PATH = ROOT_WORKDIR / "test-results.xml"


def resolve_runtime_workdir() -> Path:
    if ROOT_WORKDIR.exists():
        return ROOT_WORKDIR
    raise RuntimeError(f"Unable to determine runtime workdir ({ROOT_WORKDIR}).")


def run_pytest(runtime_workdir: Path) -> int:
    env = os.environ.copy()
    env["PYTHONPATH"] = str(SRC_PATH)
    env["PYTHONUTF8"] = "1"

    command = [
        sys.executable,
        "-m",
        "pytest",
        "-q",
        "--tb=short",
        "-p",
        "no:cacheprovider",
        "-o",
        "python_files=*.test.py",
        "--import-mode=importlib",
        f"--junitxml={PYTEST_RESULTS_PATH}",
        str(TEST_PATH),
    ]

    proc = subprocess.run(command, cwd=runtime_workdir, env=env)
    return proc.returncode


def load_pytest_summary():
    if not PYTEST_RESULTS_PATH.exists():
        return 0, 0, 0

    try:
        root = ET.parse(PYTEST_RESULTS_PATH).getroot()

        suite = root
        if root.tag == "testsuites":
            suite = root.find("testsuite")
        if suite is None:
            return 0, 0, 0

        total = int(suite.get("tests", 0))
        failures = int(suite.get("failures", 0))
        errors = int(suite.get("errors", 0))
        passed = total - failures - errors
        return passed, failures + errors, total
    except ET.ParseError:
        return 0, 0, 0


def main() -> None:
    print("Running tests...")

    runtime_workdir = resolve_runtime_workdir()
    exit_code = run_pytest(runtime_workdir)

    passed, failed, total = load_pytest_summary()

    if total == 0 and exit_code != 0:
        failed = 1

    print(f"Tests:       {passed} passed, {total} total")
    print(f"Failed:      {failed}")
    print(f"ResultsFile: {PYTEST_RESULTS_PATH}")
    print("Tests run!")

    sys.exit(exit_code)


if __name__ == "__main__":
    main()
