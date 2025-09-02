"""Server configuration for integration tests.

!! Never use this configuration in production because it
opens the server to the world and provides access to JupyterLab
JavaScript objects through the global window variable.
"""
from traitlets.config import get_config
from jupyterlab.galata import configure_jupyter_server

c = get_config()

configure_jupyter_server(c)

# Uncomment to set server log level to debug level
# c.ServerApp.log_level = "DEBUG"
