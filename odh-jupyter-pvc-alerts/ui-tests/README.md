# PVC alert browser tests

These Galata/Playwright tests intercept the storage API to simulate high usage
and recovery without filling or modifying a real PVC. They require the extension
to be installed in JupyterLab.

From the repository root:

```bash
make EXTENSION=odh-jupyter-pvc-alerts ui-tests-setup
cd odh-jupyter-pvc-alerts/ui-tests
jlpm playwright install chromium
jlpm test
```

The test server configuration disables normal security for testing only. Never
use `jupyter_server_test_config.py` in production.
