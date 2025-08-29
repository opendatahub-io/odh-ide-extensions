"""Utility for using a centralized logger"""
import logging

from traitlets.config import Application

# This is borrowed from jupyter git extension
class _ExtensionLogger:
    _LOGGER = None  # type: Optional[logging.Logger]

    @classmethod
    def get_logger(cls) -> logging.Logger:
        if cls._LOGGER is None:
            app = Application.instance()
            cls._LOGGER = logging.getLogger("{!s}.odh_jupyter_trash_cleanup".format(app.log.name))

        return cls._LOGGER


get_logger = _ExtensionLogger.get_logger