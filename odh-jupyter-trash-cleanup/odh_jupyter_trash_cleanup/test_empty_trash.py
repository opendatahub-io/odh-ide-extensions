"""Trash Tests"""

import odh_jupyter_trash_cleanup.trash as trash_mod
from odh_jupyter_trash_cleanup.trash import Trash

import pytest


def test_empty_directory_returns_zero(tmp_path):
    temp_dir = tmp_path / "empty_dir"
    temp_dir.mkdir()
    result = Trash()._clear_dir(temp_dir)
    assert result == 0


def test_directory_with_multiple_files_removes_all_and_returns_count(tmp_path):
    temp_dir = tmp_path / "dir_with_file"
    temp_dir.mkdir()
    files = ["file1.txt", "file2.txt", "file3.txt"]
    for f in files:
        (temp_dir / f).write_text("content")
    result = Trash()._clear_dir(temp_dir)
    assert result == len(files)
    for f in files:
        assert not (temp_dir / f).exists()


def test_directory_with_subdirs_removes_all_and_returns_count(tmp_path):
    temp_dir = tmp_path / "dir_with_subdirs"
    temp_dir.mkdir()
    subdir1 = temp_dir / "sub1"
    subdir1.mkdir()
    subdir2 = temp_dir / "sub2"
    subdir2.mkdir()
    result = Trash()._clear_dir(temp_dir)
    assert result == 2  # 2 directories (sub1, sub2)
    assert not subdir1.exists()
    assert not subdir2.exists()


def test_subdir_is_symlink_skips_it_and_returns_count(tmp_path):
    out_trash_dir = tmp_path / "other_dir"
    trash_dir = tmp_path / "has_symlink_subdir"
    trash_dir.mkdir()
    out_trash_dir.mkdir()
    # Create a symlink to another directory
    sub_link = trash_dir / "sub_link"
    sub_link.symlink_to(out_trash_dir)
    result = Trash()._clear_dir(trash_dir)
    # Only the symlinked subdir was listed as entry — was not removed
    assert result == 1
    # Should still exist (not followed)
    assert sub_link.exists()


@pytest.mark.asyncio
async def test_empty_trash_not_counting_info(monkeypatch, tmp_path):
    """Test the cleaning count of Trash when there's info file."""
    # Point TRASH_DIR at a temp layout
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
