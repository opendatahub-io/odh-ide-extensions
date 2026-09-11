import json
import threading
from unittest.mock import Mock

import pytest

from odh_jupyter_pvc_alerts import handlers


async def test_usage(jp_fetch, tmp_path):
    response = await jp_fetch("odh-jupyter-pvc-alerts", "usage")
    assert response.code == 200
    assert response.headers["Cache-Control"] == "no-store"
    payload = json.loads(response.body)
    assert payload["path"] == str(tmp_path)
    assert payload["totalBytes"] > 0
    assert 0 <= payload["usagePercent"] <= 100


async def test_cannot_select_path(jp_fetch, tmp_path):
    response = await jp_fetch(
        "odh-jupyter-pvc-alerts", "usage", params={"path": "/etc"}
    )
    assert json.loads(response.body)["path"] == str(tmp_path)


@pytest.mark.parametrize(
    "error", [FileNotFoundError, PermissionError, OSError]
)
async def test_unavailable_storage(jp_fetch, monkeypatch, error):
    monkeypatch.setattr(
        handlers, "get_usage", Mock(side_effect=error("private details"))
    )
    response = await jp_fetch(
        "odh-jupyter-pvc-alerts", "usage", raise_error=False
    )
    assert response.code == 503
    assert response.headers["Cache-Control"] == "no-store"
    assert b"private details" not in response.body


async def test_usage_runs_off_event_loop(jp_fetch, monkeypatch):
    main_thread = threading.get_ident()
    get_usage = handlers.get_usage

    def read_usage(path):
        assert threading.get_ident() != main_thread
        return get_usage(path)

    monkeypatch.setattr(handlers, "get_usage", read_usage)
    response = await jp_fetch("odh-jupyter-pvc-alerts", "usage")
    assert response.code == 200


async def test_authentication_required(jp_fetch):
    response = await jp_fetch(
        "odh-jupyter-pvc-alerts",
        "usage",
        headers={"Authorization": "token invalid"},
        follow_redirects=False,
        raise_error=False,
    )
    assert response.code in (302, 403)
