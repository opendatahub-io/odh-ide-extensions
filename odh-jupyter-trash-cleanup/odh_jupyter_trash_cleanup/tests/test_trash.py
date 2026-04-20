"""Tests for the trash module."""

import tempfile
from pathlib import Path
from unittest.mock import MagicMock, patch

from odh_jupyter_trash_cleanup.trash import (
    BASE_PATH,
    EMPTY_TRASH_COMMAND,
    GIO,
    LIST_TRASH_FILES_COMMAND,
    SHARE_PATH,
    TRASH_DIR,
    Trash,
)

import pytest


class TestTrashConstants:
    """Test trash module constants."""

    def test_gio_command(self):
        """Test GIO constant is defined."""
        assert GIO == "gio"

    def test_empty_trash_command(self):
        """Test empty trash command structure."""
        assert EMPTY_TRASH_COMMAND == ["gio", "trash", "--empty"]

    def test_list_trash_command(self):
        """Test list trash command structure."""
        assert LIST_TRASH_FILES_COMMAND == ["gio", "trash", "--list"]

    def test_share_path(self):
        """Test share path is under home."""
        assert SHARE_PATH == Path.home() / ".local" / "share"

    def test_trash_dir(self):
        """Test trash directory is under base path."""
        assert TRASH_DIR == BASE_PATH / "Trash"


class TestTrashClass:
    """Test Trash class."""

    def test_trash_instance(self):
        """Test Trash can be instantiated."""
        trash = Trash()
        assert trash is not None

    def test_clear_dir_nonexistent(self, tmp_path):
        """Test _clear_dir returns 0 for nonexistent path."""
        nonexistent = tmp_path / "does_not_exist"
        trash = Trash()
        result = trash._clear_dir(nonexistent)
        assert result == 0

    def test_clear_dir_empty_directory(self):
        """Test _clear_dir returns 0 for empty directory."""
        with tempfile.TemporaryDirectory() as tmpdir:
            trash = Trash()
            result = trash._clear_dir(Path(tmpdir))
            assert result == 0

    def test_clear_dir_with_files(self):
        """Test _clear_dir removes files and returns count."""
        with tempfile.TemporaryDirectory() as tmpdir:
            tmppath = Path(tmpdir)
            (tmppath / "file1.txt").write_text("test1")
            (tmppath / "file2.txt").write_text("test2")

            trash = Trash()
            result = trash._clear_dir(tmppath)

            assert result == 2
            assert not (tmppath / "file1.txt").exists()
            assert not (tmppath / "file2.txt").exists()

    @pytest.mark.asyncio
    async def test_empty_trash_no_trash_dir(self):
        """Test empty_trash when trash directory doesn't exist."""
        mock_logger = MagicMock()
        with patch(
            "odh_jupyter_trash_cleanup.trash.get_logger", return_value=mock_logger
        ):
            with patch.object(Trash, "_clear_dir", return_value=0):
                trash = Trash()
                result = await trash.empty_trash()
                assert result == 0
