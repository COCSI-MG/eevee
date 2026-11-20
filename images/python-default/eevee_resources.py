"""Access files attached to the current validation template."""

from pathlib import Path

_RESOURCE_DIRECTORY = Path("/app/test")


def resource_path(name: str) -> Path:
    """Return the path of a template resource by its uploaded filename."""
    if not name or name in (".", "..") or "/" in name or "\\" in name:
        raise ValueError("Template resource name must be a filename")
    path = _RESOURCE_DIRECTORY / name
    if not path.is_file():
        raise FileNotFoundError(f"Template resource not found: {name}")
    return path
