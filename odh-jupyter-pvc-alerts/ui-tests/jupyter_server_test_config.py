"""Insecure Galata test configuration. Never use in production."""

from jupyterlab.galata import configure_jupyter_server
from traitlets.config import get_config

c = get_config()
configure_jupyter_server(c)
