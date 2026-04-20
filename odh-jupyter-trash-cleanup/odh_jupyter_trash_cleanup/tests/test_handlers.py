"""Tests for the handlers module."""

import json

from odh_jupyter_trash_cleanup.handlers import RouteHandler, setup_handlers


class TestRouteHandler:
    """Test RouteHandler class."""

    def test_route_handler_has_trash_attribute(self):
        """Test RouteHandler has trash attribute."""
        assert hasattr(RouteHandler, "trash")

    def test_route_handler_trash_is_trash_instance(self):
        """Test trash attribute is Trash instance."""
        from odh_jupyter_trash_cleanup.trash import Trash

        assert isinstance(RouteHandler.trash, Trash)


class TestSetupHandlers:
    """Test setup_handlers function."""

    def test_setup_handlers_callable(self):
        """Test setup_handlers is callable."""
        assert callable(setup_handlers)


async def test_empty_trash(jp_fetch):
    """Test empty-trash endpoint returns success."""
    response = await jp_fetch(
        "odh-jupyter-trash-cleanup",
        "empty-trash",
        method="POST",
        allow_nonstandard_methods=True,
    )
    assert response.code == 200
    payload = json.loads(response.body)
    assert payload["message"] == "Files successfully removed from trash."
    assert "deleted" in payload


async def test_empty_trash_response_format(jp_fetch):
    """Test empty-trash endpoint returns correct JSON structure."""
    response = await jp_fetch(
        "odh-jupyter-trash-cleanup",
        "empty-trash",
        method="POST",
        allow_nonstandard_methods=True,
    )
    payload = json.loads(response.body)
    assert "message" in payload
    assert "deleted" in payload
    assert isinstance(payload["deleted"], int)
    assert isinstance(payload["message"], str)


async def test_empty_trash_content_type(jp_fetch):
    """Test empty-trash endpoint returns JSON content type."""
    response = await jp_fetch(
        "odh-jupyter-trash-cleanup",
        "empty-trash",
        method="POST",
        allow_nonstandard_methods=True,
    )
    content_type = response.headers.get("Content-Type", "")
    assert "application/json" in content_type
