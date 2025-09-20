"""Factory for the logger for this extension"""

import logging

from traitlets.config import Application

# This is borrowed from Jupyter Git extension


class _ExtensionLogger:
    _LOGGER = None

    @classmethod
    def get_logger(cls) -> logging.Logger:
        """Build a logger for this extension."""
        if cls._LOGGER is None:
            app = Application.instance()
            cls._LOGGER = logging.getLogger(
                f"{app.log.name}.odh_jupyter_trash_cleanup"
            )

        return cls._LOGGER


get_logger = _ExtensionLogger.get_logger
