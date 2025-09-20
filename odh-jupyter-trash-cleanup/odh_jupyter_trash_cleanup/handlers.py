"""Handler for Trash API methods"""

from jupyter_server.base.handlers import APIHandler
from jupyter_server.utils import url_path_join

from odh_jupyter_trash_cleanup.trash import Trash

import tornado


class RouteHandler(APIHandler):

    trash = Trash()

    @tornado.web.authenticated
    async def post(self):
        try:
            deleted = await self.trash.empty_trash()
            self.set_header("Content-Type", "application/json")
            self.set_status(200)
            self.finish(
                {
                    "message": "Files successfully removed from trash.",
                    "deleted": deleted,
                }
            )
        except Exception:
            self.log.exception("Error while emptying trash")
            self.set_header("Content-Type", "application/json")
            self.set_status(500)
            self.finish({"message": "Failed to remove files from trash."})


def setup_handlers(web_app):
    host_pattern = ".*$"

    base_url = web_app.settings["base_url"]
    route_pattern = url_path_join(
        base_url,
        "odh-jupyter-trash-cleanup",
        "empty-trash",
    )
    handlers = [(route_pattern, RouteHandler)]
    web_app.add_handlers(host_pattern, handlers)
