"""Module for trash functions"""
from pathlib import Path

import shutil
import os
import logging

# For Trash cleaning using gio
GIO = "gio"
EMPTY_TRASH_COMMAND = [GIO, "trash", "--empty"]
LIST_TRASH_FILES_COMMAND = [GIO, "trash", "--list"]

# For manual removal of files
XDG_DATA_HOME = os.environ.get("XDG_DATA_HOME")
TRASH_DIR = (Path(XDG_DATA_HOME) if XDG_DATA_HOME else Path.home() / ".local" / "share") / "Trash"

logger = logging.getLogger(__name__)

class Trash:
    """Trash functions"""

    async def empty_trash(self) -> int:
        """Permanently delete all items from Trash"""
        logger.warning("Removing files from the trash")
        # info files are metadata, not the actual file.
        self._clear_dir(TRASH_DIR / "info")
        deleted = self._clear_dir(TRASH_DIR / "files")
        logger.warning("Files removed from the trash: %d", deleted)
        return deleted

    def _clear_dir(self, p: Path) -> int:
        count = 0
        if not p.exists():
            return 0
        # Refuse to traverse if the subdir itself is a symlink
        if p.is_symlink():
            logger.warning("Refusing to traverse symlinked trash subdir: %s", p)
            return 0
        # If a file exists where a directory is expected, remove it
        if p.is_file():
            try:
                p.unlink(missing_ok=True)  # type: ignore[arg-type]
                return 1
            except FileNotFoundError:
                logger.exception("Failed to remove %s", p)
                return 0
        for child in p.iterdir():
            try:
                if child.is_symlink():
                    logger.warning("Skipping symlink in trash: %s", child)
                    count += 1
                    continue
                if child.is_file():
                    child.unlink(missing_ok=True)
                elif child.is_dir():
                    shutil.rmtree(child, ignore_errors=True)
                count += 1
            except FileNotFoundError:
                # Best-effort cleanup; log and continue
                logger.exception("Failed to remove %s", child)
        return count
