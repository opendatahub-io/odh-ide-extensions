"""Tests for the trash module."""

from pathlib import Path

from odh_jupyter_trash_cleanup.trash import (
    BASE_PATH,
    EMPTY_TRASH_COMMAND,
    GIO,
    LIST_TRASH_FILES_COMMAND,
    SHARE_PATH,
    TRASH_DIR,
    Trash,
)


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
