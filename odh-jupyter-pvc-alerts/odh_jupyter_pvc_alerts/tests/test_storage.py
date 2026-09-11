import os
from types import SimpleNamespace

import pytest
from traitlets.config import Config

from odh_jupyter_pvc_alerts.config import PVCAlertsConfig
from odh_jupyter_pvc_alerts.storage import get_usage


@pytest.mark.parametrize(
    "free,available,expected",
    [(100, 100, 0), (10, 10, 90), (10, 5, 90 / 95 * 100), (0, 0, 100)],
)
def test_usage(monkeypatch, free, available, expected):
    monkeypatch.setattr(
        os,
        "statvfs",
        lambda path: SimpleNamespace(
            f_blocks=100, f_bfree=free, f_bavail=available, f_frsize=4096
        ),
    )
    usage = get_usage("/notebook")
    assert usage["totalBytes"] == 100 * 4096
    assert usage["usedBytes"] == (100 - free) * 4096
    assert usage["availableBytes"] == available * 4096
    assert usage["usagePercent"] == pytest.approx(expected)
    assert usage["path"] == "/notebook"


def test_negative_available_is_full(monkeypatch):
    monkeypatch.setattr(
        os,
        "statvfs",
        lambda path: SimpleNamespace(
            f_blocks=100, f_bfree=5, f_bavail=-5, f_frsize=4096
        ),
    )
    assert get_usage("/notebook")["usagePercent"] == 100


@pytest.mark.parametrize(
    "blocks,free,available,block_size",
    [(0, 0, 0, 4096), (100, 100, 0, 4096), (100, 10, 10, 0)],
)
def test_unusable_capacity(monkeypatch, blocks, free, available, block_size):
    monkeypatch.setattr(
        os,
        "statvfs",
        lambda path: SimpleNamespace(
            f_blocks=blocks,
            f_bfree=free,
            f_bavail=available,
            f_frsize=block_size,
        ),
    )
    with pytest.raises(OSError):
        get_usage("/notebook")


def test_real_filesystem(tmp_path):
    usage = get_usage(str(tmp_path))
    assert usage["totalBytes"] > 0
    assert 0 <= usage["usagePercent"] <= 100


def test_missing_path(tmp_path):
    with pytest.raises(FileNotFoundError):
        get_usage(str(tmp_path / "missing"))


def test_config_precedence(monkeypatch):
    monkeypatch.delenv("ODH_PVC_MOUNT_PATH", raising=False)
    assert PVCAlertsConfig().storage_path("/root") == "/root"
    monkeypatch.setenv("ODH_PVC_MOUNT_PATH", "/env")
    assert PVCAlertsConfig().storage_path("/root") == "/env"
    config = Config({"PVCAlertsConfig": {"mount_path": "/configured"}})
    assert (
        PVCAlertsConfig(config=config).storage_path("/root") == "/configured"
    )


def test_explicit_empty_path_uses_root(monkeypatch):
    monkeypatch.setenv("ODH_PVC_MOUNT_PATH", "/env")
    config = Config({"PVCAlertsConfig": {"mount_path": ""}})
    assert PVCAlertsConfig(config=config).storage_path("/root") == "/root"


def test_home_directory_expansion(monkeypatch, tmp_path):
    monkeypatch.setenv("HOME", str(tmp_path))
    assert PVCAlertsConfig(mount_path="~/notebook").storage_path("/root") == (
        str(tmp_path / "notebook")
    )


def test_relative_path_rejected():
    with pytest.raises(ValueError, match="must be absolute"):
        PVCAlertsConfig(mount_path="relative").storage_path("/root")
