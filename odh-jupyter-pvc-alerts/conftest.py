import pytest

pytest_plugins = ("pytest_jupyter.jupyter_server",)


@pytest.fixture
def jp_base_url():
    return "/notebook/test/"


@pytest.fixture
def jp_server_config(tmp_path):
    return {
        "ServerApp": {
            "jpserver_extensions": {"odh_jupyter_pvc_alerts": True},
        },
        "PVCAlertsConfig": {"mount_path": str(tmp_path)},
    }
