import json


async def test_empty_trash(jp_fetch):
    # When
    response = await jp_fetch(
        "odh-jupyter-trash-cleanup",
        "empty-trash",
        method="POST",
        allow_nonstandard_methods=True,
    )
    # Then
    assert response.code == 200
    payload = json.loads(response.body)
    assert payload["message"] == "Files successfully removed from trash."
    assert "deleted" in payload
