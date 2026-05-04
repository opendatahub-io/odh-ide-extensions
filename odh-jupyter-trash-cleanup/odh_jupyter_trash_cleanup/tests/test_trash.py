"""Tests for the trash module."""

from pathlib import Path

import odh_jupyter_trash_cleanup.trash as trash_mod
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


class TestClearDir:
    """Test Trash._clear_dir method."""

    def test_empty_directory_returns_zero(self, tmp_path):
        """Test _clear_dir returns 0 for empty directory."""
        temp_dir = tmp_path / "empty_dir"
        temp_dir.mkdir()
        result = Trash()._clear_dir(temp_dir)
        assert result == 0

    def test_directory_with_multiple_files_removes_all(self, tmp_path):
        """Test _clear_dir removes files and returns count."""
        temp_dir = tmp_path / "dir_with_file"
        temp_dir.mkdir()
        files = ["file1.txt", "file2.txt", "file3.txt"]
        for f in files:
            (temp_dir / f).write_text("content")
        result = Trash()._clear_dir(temp_dir)
        assert result == len(files)
        for f in files:
            assert not (temp_dir / f).exists()

    def test_directory_with_subdirs_removes_all(self, tmp_path):
        """Test _clear_dir removes subdirectories and returns count."""
        temp_dir = tmp_path / "dir_with_subdirs"
        temp_dir.mkdir()
        subdir1 = temp_dir / "sub1"
        subdir1.mkdir()
        subdir2 = temp_dir / "sub2"
        subdir2.mkdir()
        result = Trash()._clear_dir(temp_dir)
        assert result == 2
        assert not subdir1.exists()
        assert not subdir2.exists()

    def test_symlink_skipped_not_followed(self, tmp_path):
        """Test _clear_dir skips symlinks for safety (not counted as removed)."""
        out_trash_dir = tmp_path / "other_dir"
        trash_dir = tmp_path / "has_symlink_subdir"
        trash_dir.mkdir()
        out_trash_dir.mkdir()
        sub_link = trash_dir / "sub_link"
        sub_link.symlink_to(out_trash_dir)
        result = Trash()._clear_dir(trash_dir)
        assert result == 0  # Symlinks are skipped, not counted as removed
        assert sub_link.exists()  # Symlink should still exist (not followed)


class TestEmptyTrash:
    """Test Trash.empty_trash method."""

    @pytest.mark.asyncio
    async def test_empty_trash_counts_files_not_info(self, monkeypatch, tmp_path):
        """Test empty_trash counts only actual files, not .trashinfo."""
        files = tmp_path / "files"
        info = tmp_path / "info"
        files.mkdir()
        info.mkdir()
        (files / "a.txt").write_text("x")
        (info / "a.trashinfo").write_text("[Trash Info]")
        monkeypatch.setattr(trash_mod, "TRASH_DIR", tmp_path, raising=True)
        deleted = await trash_mod.Trash().empty_trash()
        assert deleted == 1
        assert not (files / "a.txt").exists()
        assert not (info / "a.trashinfo").exists()
