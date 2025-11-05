# Integration Testing

This folder contains the integration tests of the extension.

They are defined using [Playwright](https://playwright.dev/docs/intro) test runner
and [Galata](https://github.com/jupyterlab/jupyterlab/tree/main/galata) helper.

The Playwright configuration is defined in [playwright.config.js](./playwright.config.js).

The JupyterLab server configuration to use for the integration test is defined
in [jupyter_server_test_config.py](./jupyter_server_test_config.py).

The default configuration will produce video for failing tests and an HTML report.

> There is a UI mode that you may like; see [that video](https://www.youtube.com/watch?v=jF0yA-JLQW0).

## Run the tests

> All commands are assumed to be executed from the root directory

To run the tests, you need to:

1. Set up dependencies and build the extension (needed only once, or when dependencies change):

```sh
make EXTENSION=odh-jupyter-trash-cleanup ui-tests-setup
```

2. Execute the [Playwright](https://playwright.dev/docs/intro) tests:

```sh
make EXTENSION=odh-jupyter-trash-cleanup ui-tests
```

Test results will be shown in the terminal. In case of any test failures, the test report
will be opened in your browser at the end of the tests execution; see
[Playwright documentation](https://playwright.dev/docs/test-reporters#html-reporter)
for configuring that behavior.

## Update the tests snapshots

> All commands are assumed to be executed from the root directory

If you are comparing snapshots to validate your tests, you may need to update
the reference snapshots stored in the repository. To do that, you need to:

1. Ensure dependencies are set up (if not already done):

```sh
make EXTENSION=odh-jupyter-trash-cleanup ui-tests-setup
```

2. Execute the [Playwright](https://playwright.dev/docs/intro) command to update snapshots:

```sh
cd odh-jupyter-trash-cleanup/ui-tests
jlpm test:update
```

> Some discrepancy may occur between the snapshots generated on your computer and
> the one generated on the CI. To ease updating the snapshots on a PR, you can
> type `please update playwright snapshots` to trigger the update by a bot on the CI.
> Once the bot has computed new snapshots, it will commit them to the PR branch.

## Create tests

> All commands are assumed to be executed from the root directory

To create tests, the easiest way is to use the code generator tool of playwright:

1. Ensure dependencies are set up (if not already done):

```sh
make EXTENSION=odh-jupyter-trash-cleanup ui-tests-setup
```

2. Start the server:

```sh
cd odh-jupyter-trash-cleanup/ui-tests
jlpm start
```

3. Execute the [Playwright code generator](https://playwright.dev/docs/codegen) in **another terminal**:

```sh
cd odh-jupyter-trash-cleanup/ui-tests
jlpm playwright codegen localhost:8888
```

## Debug tests

> All commands are assumed to be executed from the root directory

To debug tests, a good way is to use the inspector tool of playwright:

1. Ensure dependencies are set up (if not already done):

```sh
make EXTENSION=odh-jupyter-trash-cleanup ui-tests-setup
```

2. Execute the Playwright tests in [debug mode](https://playwright.dev/docs/debug):

```sh
cd odh-jupyter-trash-cleanup/ui-tests
jlpm playwright test --debug
```

## Upgrade Playwright and the browsers

To update the web browser versions, you must update the package `@playwright/test`:

```sh
cd ui-tests
jlpm up "@playwright/test"
jlpm playwright install
```
