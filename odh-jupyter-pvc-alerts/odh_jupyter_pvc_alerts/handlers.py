"""Authenticated, read-only API for the configured filesystem."""

import asyncio

from jupyter_server.base.handlers import APIHandler
from jupyter_server.utils import url_path_join
from tornado import web

from .storage import get_usage


class UsageHandler(APIHandler):
    """Serve filesystem usage for the administrator-selected path."""

    def initialize(self, path: str) -> None:
        """Bind the configured path to this handler."""
        self.storage_path = path

    def set_default_headers(self) -> None:
        """Prevent caching of both successful responses and errors."""
        super().set_default_headers()
        self.set_header("Cache-Control", "no-store")

    @web.authenticated
    async def get(self) -> None:
        """Read usage off the event loop and return uncached JSON."""
        try:
            usage = await asyncio.to_thread(get_usage, self.storage_path)
        except OSError:
            self.log.warning(
                "Unable to read PVC filesystem usage", exc_info=True
            )
            raise web.HTTPError(
                503, reason="Unable to read configured storage usage"
            ) from None
        self.finish(usage)


def setup_handlers(web_app: web.Application, path: str) -> None:
    """Register the endpoint under the notebook server's base URL."""
    route = url_path_join(
        web_app.settings["base_url"], "odh-jupyter-pvc-alerts", "usage"
    )
    web_app.add_handlers(".*$", [(route, UsageHandler, {"path": path})])
