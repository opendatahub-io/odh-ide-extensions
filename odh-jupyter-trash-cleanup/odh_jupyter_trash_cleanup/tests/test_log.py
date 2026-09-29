"""Tests for the log module."""

import logging
from unittest.mock import MagicMock, patch

from odh_jupyter_trash_cleanup.log import _ExtensionLogger, get_logger

import pytest


@pytest.fixture(autouse=True)
def reset_extension_logger():
    """Snapshot and restore the singleton to avoid order-dependent failures."""
    previous_logger = _ExtensionLogger._LOGGER
    _ExtensionLogger._LOGGER = None
    yield
    _ExtensionLogger._LOGGER = previous_logger


class TestExtensionLogger:
    """Test _ExtensionLogger class."""

    def test_get_logger_returns_logger(self):
        """Test get_logger returns a Logger instance."""
        mock_app = MagicMock()
        mock_app.log.name = "test_app"

        with patch(
            "odh_jupyter_trash_cleanup.log.Application.instance",
            return_value=mock_app,
        ):
            logger = get_logger()
            assert isinstance(logger, logging.Logger)

    def test_get_logger_singleton(self):
        """Test get_logger returns same instance."""
        mock_app = MagicMock()
        mock_app.log.name = "test_app"

        with patch(
            "odh_jupyter_trash_cleanup.log.Application.instance",
            return_value=mock_app,
        ):
            logger1 = get_logger()
            logger2 = get_logger()
            assert logger1 is logger2

    def test_get_logger_name_format(self):
        """Test logger name includes extension name."""
        mock_app = MagicMock()
        mock_app.log.name = "jupyter"

        with patch(
            "odh_jupyter_trash_cleanup.log.Application.instance",
            return_value=mock_app,
        ):
            logger = get_logger()
            assert "odh_jupyter_trash_cleanup" in logger.name


class TestGetLoggerFunction:
    """Test get_logger function."""

    def test_get_logger_returns_same_as_class_method(self):
        """Test get_logger returns same result as _ExtensionLogger.get_logger."""
        mock_app = MagicMock()
        mock_app.log.name = "test_app"

        with patch(
            "odh_jupyter_trash_cleanup.log.Application.instance",
            return_value=mock_app,
        ):
            result1 = get_logger()
            result2 = _ExtensionLogger.get_logger()
            assert result1 is result2
