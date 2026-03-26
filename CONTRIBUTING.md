# Contributing to ODH IDE Extensions

Thank you for contributing to Open Data Hub IDE Extensions! This guide will help you get started with development.

## Prerequisites

- **Node.js** (version 18+)
- **Python** 3.9+
- **JupyterLab** 4.0+
- **yarn** or **npm** (we use `jlpm` - JupyterLab's pinned yarn)

## Getting Started

### Clone and Install

```bash
git clone https://github.com/opendatahub-io/odh-ide-extensions.git
cd odh-ide-extensions
npm install
```

## Development Workflow

### Working on an Extension

For individual extension development (e.g., `odh-jupyter-trash-cleanup`):

```bash
cd odh-jupyter-trash-cleanup

# Install Python package in development mode
pip install -e ".[test]"

# Link extension with JupyterLab
jupyter labextension develop . --overwrite

# Enable server extension (if applicable)
jupyter server extension enable odh_jupyter_trash_cleanup
```

### Live Development

Run these in separate terminals:

```bash
# Terminal 1: Watch and auto-rebuild TypeScript
cd odh-jupyter-trash-cleanup
jlpm watch

# Terminal 2: Run JupyterLab
jupyter lab
```

After making changes, refresh your browser to see updates (may take a few seconds to rebuild).

## Building

### Single Extension Build

```bash
cd odh-jupyter-trash-cleanup

jlpm build           # Development build
jlpm build:prod      # Production build
```

### Build Components

Extensions have multiple build targets:

- `build:lib` - Compile TypeScript to JavaScript
- `build:labextension` - Build JupyterLab extension
- `build:labextension:dev` - Build with source maps for debugging

## Testing

### Frontend Tests (Jest)

```bash
cd odh-jupyter-trash-cleanup
jlpm test
```

### Backend Tests (Pytest)

```bash
cd odh-jupyter-trash-cleanup
pip install -e ".[test]"
pytest -vv -r ap --cov odh_jupyter_trash_cleanup
```

### Integration Tests (Playwright)

```bash
# Setup (first time only)
make EXTENSION=odh-jupyter-trash-cleanup ui-tests-setup

# Run tests
make EXTENSION=odh-jupyter-trash-cleanup ui-tests

# Or directly:
cd odh-jupyter-trash-cleanup/ui-tests
jlpm test
```

## Debugging

### Enable Source Maps

Development builds include source maps by default. For JupyterLab core source maps:

```bash
jupyter lab build --minimize=False
```

### Browser DevTools

1. Open browser DevTools (F12)
2. Find your extension's TypeScript files in Sources
3. Set breakpoints and inspect variables

### Server-side Debugging

Enable logging for server extensions:

```bash
jupyter lab --debug
```

### Check Extension Status

```bash
# List server extensions
jupyter server extension list

# List lab extensions
jupyter labextension list
```

## Linting

### Individual Extension

```bash
# Lint UI (TypeScript, CSS, Prettier)
make EXTENSION=odh-jupyter-trash-cleanup lint-ui

# Lint Python
make EXTENSION=odh-jupyter-trash-cleanup lint-python

# Lint everything
make EXTENSION=odh-jupyter-trash-cleanup lint
```

### Auto-fix Issues

```bash
# Format with Prettier
make EXTENSION=odh-jupyter-trash-cleanup prettier-ui

# Fix ESLint issues
make EXTENSION=odh-jupyter-trash-cleanup eslint-ui

# Format Python with Black
make EXTENSION=odh-jupyter-trash-cleanup black-format
```

## Code Style

### TypeScript/JavaScript

- **Quotes**: Single quotes
- **Trailing commas**: None
- **Arrow functions**: Avoid parentheses for single params
- **Interfaces**: Must start with `I` (e.g., `ITrashConfig`)

### Python

- Follow **PEP 8**
- Use **Black** formatter
- Maximum line length: 88 characters

## Adding a New Extension

1. Create extension directory in the repository root
2. Add to `workspaces` in root `package.json`
3. Follow the structure of existing extensions:
   ```text
   my-extension/
   ├── src/              # TypeScript source
   ├── style/            # CSS styles
   ├── schema/           # JSON schemas
   ├── my_extension/     # Python package
   ├── package.json
   ├── pyproject.toml
   └── README.md
   ```
4. Update root `README.md` to document the new extension

## Submitting Changes

### Before Submitting

- [ ] Tests pass locally
- [ ] Code is linted and formatted
- [ ] Extension works in JupyterLab
- [ ] Documentation updated (if needed)

### Pull Request Process

1. Create a feature branch from `main`
2. Make your changes
3. Run tests and linting
4. Submit PR using the template
5. Address review feedback

## Cleaning Up

### Remove Development Installation

```bash
# Disable server extension
jupyter server extension disable odh_jupyter_trash_cleanup

# Uninstall Python package
pip uninstall odh_jupyter_trash_cleanup

# Find and remove symlink
jupyter labextension list
# Then remove the symlink (typically in ~/.local/share/jupyter/labextensions/ or similar):
# jupyter labextension uninstall `@odh/odh-jupyter-trash-cleanup`
```

### Clean Build Artifacts

```bash
cd odh-jupyter-trash-cleanup
jlpm clean:all
```

## Getting Help

- **Issues**: Check [GitHub Issues](https://github.com/opendatahub-io/odh-ide-extensions/issues)
- **Discussions**: Start a discussion for questions
- **Documentation**: See extension-specific READMEs

## License

By contributing, you agree that your contributions will be licensed under the Apache License 2.0.
