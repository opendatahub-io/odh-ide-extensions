"""JupyterLab PVC storage alerts server extension."""

from .config import PVCAlertsConfig
from .handlers import setup_handlers


def _jupyter_labextension_paths():
    return [{"src": "labextension", "dest": "odh-jupyter-pvc-alerts"}]


def _jupyter_server_extension_points():
    return [{"module": "odh_jupyter_pvc_alerts"}]


def _load_jupyter_server_extension(server_app):
    config = PVCAlertsConfig(parent=server_app)
    path = config.storage_path(server_app.root_dir)
    setup_handlers(server_app.web_app, path)
    server_app.log.info("PVC storage alerts monitoring filesystem at %s", path)
