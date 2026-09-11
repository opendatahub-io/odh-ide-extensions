"""Administrator-controlled storage selection (never supplied by clients)."""

import os
from pathlib import Path

from traitlets import default, Unicode
from traitlets.config import Configurable


class PVCAlertsConfig(Configurable):
    """Configure the filesystem monitored by the server extension."""

    mount_path = Unicode(
        config=True,
        help=(
            "Absolute path on the notebook PVC. Defaults to "
            "ODH_PVC_MOUNT_PATH or ServerApp.root_dir. Requires a restart."
        ),
    )

    @default("mount_path")
    def _default_mount_path(self) -> str:
        return os.environ.get("ODH_PVC_MOUNT_PATH", "")

    def storage_path(self, root_dir: str) -> str:
        """Select an absolute path without silently changing filesystems."""
        path = Path(self.mount_path or root_dir).expanduser()
        if not path.is_absolute():
            raise ValueError("PVCAlertsConfig.mount_path must be absolute")
        return str(path)
