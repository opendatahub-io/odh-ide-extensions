# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a monorepo for OpenDataHub IDE extensions, managed with Turbo for efficient build orchestration. Currently contains `odh-jupyter-trash-cleanup`, a JupyterLab extension that provides trash cleanup functionality directly from the JupyterLab UI.

**For detailed architectural information**, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), which provides comprehensive documentation on component structure, communication patterns, build pipeline, and extension lifecycle.

## Architecture

### Dual-Component Extension Pattern

Each JupyterLab extension follows a dual-component architecture:

- **Server extension** (Python): Jupyter Server extension that handles backend logic
  - Located in `odh_jupyter_trash_cleanup/` (Python package with underscores)
  - Registers server handlers and API endpoints
  - For trash cleanup: manages XDG Base Directory spec compliance (`$XDG_DATA_HOME/Trash` or `~/.local/share/Trash`)

- **Frontend extension** (TypeScript): JupyterLab UI components
  - Located in `src/` (TypeScript sources) → compiled to `lib/`
  - Located in `style/` (CSS styles)
  - NPM package name uses hyphens (`odh-jupyter-trash-cleanup`)
  - Integrates with JupyterLab's plugin system

- **Labextension artifact**: Built frontend bundled into Python package
  - Built output goes to `odh_jupyter_trash_cleanup/labextension/`
  - Distributed as part of the Python wheel for pip installation

### Workspace Structure

```text
odh-ide-extensions/           # Root workspace
├── odh-jupyter-trash-cleanup/      # Extension package
│   ├── src/                        # TypeScript frontend sources
│   ├── style/                      # CSS styles
│   ├── odh_jupyter_trash_cleanup/  # Python server extension
│   ├── ui-tests/                   # Playwright integration tests
│   └── package.json                # Extension npm config
├── turbo.json                      # Turbo build pipeline config
└── package.json                    # Root workspace config
```

## Development Commands

### Building

```bash
# Build all extensions (from root)
npm run build              # Development mode
npm run build:prod         # Production mode

# Build single extension (from extension directory)
cd odh-jupyter-trash-cleanup
jlpm build                 # Dev build with source maps
jlpm build:prod            # Production build
jlpm watch                 # Watch mode for development
```

### Testing

```bash
# From root - run all tests via Turbo
npm run test

# Frontend unit tests (from extension directory)
cd odh-jupyter-trash-cleanup
jlpm test                  # Jest tests with coverage

# Python server tests (from extension directory)
cd odh-jupyter-trash-cleanup
pytest -vv -r ap --cov odh_jupyter_trash_cleanup

# Integration tests (Playwright/Galata)
make EXTENSION=odh-jupyter-trash-cleanup ui-tests-setup  # One-time setup
make EXTENSION=odh-jupyter-trash-cleanup ui-tests        # Run tests
```

### Linting

```bash
# Lint specific extension (from root - required pattern)
make EXTENSION=odh-jupyter-trash-cleanup lint         # Runs all linters (check-only, use black-format for fixes)
make EXTENSION=odh-jupyter-trash-cleanup lint-python  # Python only (flake8 + black)
make EXTENSION=odh-jupyter-trash-cleanup lint-ui      # UI only (prettier + eslint + stylelint)
```

Note: The Makefile requires `EXTENSION` parameter for all lint commands.

### Development Installation

See [CONTRIBUTING.md](CONTRIBUTING.md#working-on-an-extension) for development setup instructions.

## Code Style and Conventions

### TypeScript/JavaScript

- **Interfaces**: Must be PascalCase and prefixed with `I` (e.g., `ITrashEmptyResponse`)
- **Quotes**: Single quotes only (enforced by ESLint)
- **Equality**: Always use `===` (strict equality)
- **Callbacks**: Prefer arrow functions
- **Configuration**: Root `eslint.config.mjs` for workspace, individual extension configs in `package.json`

### Python

- **Formatter**: Black with 79-character line length
- **Linter**: flake8 with Google import order style
- **Target**: Python 3.9+ (supports up to 3.13)
- **Configuration**: `pyproject.toml` in both root and extension directories

### CSS

- Uses Stylelint with `stylelint-config-standard` and `stylelint-prettier`
- Validated with `stylelint-csstree-validator`

## Testing Strategy

1. **Frontend unit tests**: Jest tests in `src/__tests__/`
2. **Python unit tests**: Pytest tests in `odh_jupyter_trash_cleanup/tests/` and root-level `test_*.py` files
3. **Integration tests**: Playwright/Galata tests in `ui-tests/` directory
   - Test actual JupyterLab UI behavior
   - See `ui-tests/README.md` for details on debugging, snapshots, and code generation

## Build System Notes

- **Turbo**: Orchestrates builds across workspaces, caches outputs in `.turbo/`
- **jlpm**: JupyterLab's pinned version of yarn (can use yarn or npm as alternative)
- **Hatchling**: Python build backend with `hatch-jupyter-builder` for JupyterLab integration
- Build outputs:
  - TypeScript → `lib/` (compiled JS)
  - Frontend bundle → `odh_jupyter_trash_cleanup/labextension/`
  - Python package version synced from `package.json` via hatchling nodejs hook

## Adding New Extensions

When adding a new extension to the monorepo:

1. Create extension directory with proper structure (server + frontend)
2. Add to `workspaces` array in root `package.json`
3. Follow existing naming convention: `odh-{purpose}` (hyphens for npm, underscores for Python)
4. Include both `package.json` and `pyproject.toml` with proper JupyterLab metadata
5. Update root README.md with extension description

**See [docs/ARCHITECTURE.md#adding-new-extensions](docs/ARCHITECTURE.md#adding-new-extensions) for detailed step-by-step instructions.**

## Important Patterns

### API Communication
- Frontend uses `requestAPI()` helper from `handler.ts` pattern
- Backend handlers extend `APIHandler` from `jupyter_server.base.handlers`
- API namespace matches NPM package name (e.g., `/odh-jupyter-trash-cleanup/endpoint`)
- All requests are authenticated via JupyterLab's token system

### Extension Registration
- Frontend: Export default `JupyterFrontEndPlugin` from `src/index.ts`
- Backend: Implement three functions in `__init__.py`:
  - `_jupyter_labextension_paths()` - Returns labextension metadata
  - `_jupyter_server_extension_points()` - Returns server extension entry points
  - `_load_jupyter_server_extension()` - Loads and configures the server extension

### Async Operations
- Backend: Use `asyncio.to_thread()` for blocking I/O operations
- Frontend: Use `Notification.promise()` pattern for user feedback on async operations
