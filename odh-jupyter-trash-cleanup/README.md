# odh-jupyter-trash-cleanup (Python package: odh_jupyter_trash_cleanup)

<!-- CI badge goes here when workflow is available -->
<!-- Binder badge disabled until configured for this repo -->

A JupyterLab extension that lets users empty the Trash from the JupyterLab UI.

This extension is composed of a Python package named `odh_jupyter_trash_cleanup`
for the server extension and an npm package named `odh-jupyter-trash-cleanup`
for the frontend extension.

## How does it work?

When you click the Trash button or use the "Empty Trash" command, all items under the Trash directory are permanently deleted. The Trash location follows the [XDG Base Directory spec](https://specifications.freedesktop.org/basedir-spec/latest/): `$XDG_DATA_HOME/Trash` when `XDG_DATA_HOME` is set; otherwise `~/.local/share/Trash`.

> Warning: Emptying the Trash is irreversible. Items cannot be recovered after this action.

## How to use it?

When the extension is installed you should see the Trash button on the file browser tool bar and also a new action called `Empty Trash`:

<img width="1386" height="343" alt="image" src="https://github.com/user-attachments/assets/844c6ed0-5418-46dd-a1ca-40e38986c5d4" />

When clicking on it, a confirmation pop-up will appear

<img width="351" height="137" alt="image" src="https://github.com/user-attachments/assets/3a9b1414-b00e-4454-9464-353962335d62" />

If "Empty Trash" is clicked, then a notification on the bottom right side of the screen will show the progress of file deletion, and then the number of removed files.

<img width="345" height="75" alt="image" src="https://github.com/user-attachments/assets/c6844b1d-96b8-4f1e-9954-ea4c88351a97" />

If there's no file to remove, then the message will confirm that no file was removed.

<img width="345" height="75" alt="image" src="https://github.com/user-attachments/assets/7b49a286-6054-4600-ae06-a38bd19f66eb" />

## Requirements

- JupyterLab >= 4.0.0
- Jupyter Server >= 2.0
- Python >= 3.8

## Install

To install the extension, execute:

```bash
pip install odh_jupyter_trash_cleanup
```

## Uninstall

To remove the extension, execute:

```bash
pip uninstall odh_jupyter_trash_cleanup
```

## Troubleshoot

If you see the frontend extension but it is not working, check
that the server extension is enabled:

```bash
jupyter server extension list
```

If the server extension is installed and enabled but you are not seeing
the frontend extension, verify that the frontend extension is installed:

```bash
jupyter labextension list
```

## Contributing

### Development install

Note: You will need Node.js to build the extension package.

The `jlpm` command is JupyterLab's pinned version of
[yarn](https://yarnpkg.com/) that is installed with JupyterLab. You may use
`yarn` or `npm` in lieu of `jlpm` below.

```bash
# Clone the repo to your local environment
# Change directory to the odh-jupyter-trash-cleanup directory
cd odh-jupyter-trash-cleanup
# Install package in development mode
pip install -e ".[test]"
# Link your development version of the extension with JupyterLab
jupyter labextension develop . --overwrite
# Server extension must be manually installed in develop mode
jupyter server extension enable odh_jupyter_trash_cleanup
# Rebuild extension Typescript source after making changes
jlpm build
```

You can watch the source directory and run JupyterLab at the same time in different terminals to watch for changes in the extension's source and automatically rebuild the extension.

```bash
# Watch the source directory in one terminal, automatically rebuilding when needed
jlpm watch
# Run JupyterLab in another terminal
jupyter lab
```

With the watch command running, every saved change will immediately be built locally and available in your running JupyterLab. Refresh JupyterLab to load the change in your browser (you may need to wait several seconds for the extension to be rebuilt).

By default, the `jlpm build` command generates the source maps for this extension to make it easier to debug using the browser dev tools. To also generate source maps for the JupyterLab core extensions, you can run the following command:

```bash
jupyter lab build --minimize=False
```

### Development uninstall

```bash
# Server extension must be manually disabled in develop mode
jupyter server extension disable odh_jupyter_trash_cleanup
pip uninstall odh_jupyter_trash_cleanup
```

In development mode, you will also need to remove the symlink created by the `jupyter labextension develop`
command. To find its location, run `jupyter labextension list` to figure out where the `labextensions`
folder is located. Then you can remove the symlink named `odh-jupyter-trash-cleanup` within that folder.

### Testing the extension

#### Server tests

This extension is using [Pytest](https://docs.pytest.org/) for Python code testing.

Install test dependencies (needed only once):

```sh
pip install -e ".[test]"
# Each time you install the Python package, you need to restore the front-end extension link
jupyter labextension develop . --overwrite
```

To execute them, run:

```sh
pytest -vv -r ap --cov odh_jupyter_trash_cleanup
```

#### Frontend tests

This extension is using [Jest](https://jestjs.io/) for JavaScript code testing.

To execute them, execute:

```sh
jlpm
jlpm test
```

#### Integration tests

This extension uses [Playwright](https://playwright.dev/docs/intro) for the integration tests (aka user-level tests).
More precisely, the JupyterLab helper [Galata](https://github.com/jupyterlab/jupyterlab/tree/master/galata) is used to handle testing the extension in JupyterLab.

More information is provided within the [ui-tests](./ui-tests/README.md) README.

### Packaging the extension

See [RELEASE](RELEASE.md)
