# Architecture Documentation

This document provides detailed architectural documentation for the OpenDataHub IDE Extensions repository to help AI agents and developers understand the codebase structure, design patterns, and component interactions.

## Table of Contents

1. [High-Level Architecture](#high-level-architecture)
2. [Extension Architecture Pattern](#extension-architecture-pattern)
3. [Component Breakdown](#component-breakdown)
4. [Communication Flow](#communication-flow)
5. [Build and Packaging Pipeline](#build-and-packaging-pipeline)
6. [Extension Lifecycle](#extension-lifecycle)
7. [File Structure and Naming Conventions](#file-structure-and-naming-conventions)
8. [Adding New Extensions](#adding-new-extensions)

---

## High-Level Architecture

This is a **monorepo** containing JupyterLab extensions for the OpenDataHub ecosystem. The repository uses:

- **Turbo**: Build orchestration and caching across workspace packages
- **npm workspaces**: Dependency management and package organization
- **JupyterLab Extension System**: Plugin-based architecture for extending JupyterLab functionality

```
┌─────────────────────────────────────────────────────────────┐
│                    odh-ide-extensions                        │
│                      (Root Workspace)                        │
│                                                              │
│  ┌────────────────────────────────────────────────────┐     │
│  │      odh-jupyter-trash-cleanup                     │     │
│  │                                                     │     │
│  │  ┌──────────────┐         ┌──────────────┐        │     │
│  │  │   Frontend   │ ←─────→ │   Backend    │        │     │
│  │  │  (TypeScript)│   HTTP  │   (Python)   │        │     │
│  │  └──────────────┘         └──────────────┘        │     │
│  │                                                     │     │
│  │  ┌──────────────────────────────────────────┐     │     │
│  │  │         ui-tests (Playwright)            │     │     │
│  │  └──────────────────────────────────────────┘     │     │
│  └────────────────────────────────────────────────────┘     │
│                                                              │
│  [Future extensions follow the same pattern]                │
└─────────────────────────────────────────────────────────────┘
```

---

## Extension Architecture Pattern

Each JupyterLab extension in this repository follows a **dual-component architecture** with three main parts:

### 1. Frontend Extension (TypeScript/JavaScript)

**Purpose**: Provides UI components, commands, and user interactions within JupyterLab.

**Location**: `src/` directory (compiled to `lib/`)

**Key Responsibilities**:
- Register JupyterLab plugins and commands
- Handle UI interactions (buttons, dialogs, notifications)
- Make HTTP requests to the backend API
- Integrate with JupyterLab's command palette and toolbars

**Entry Point**: `src/index.ts`

```typescript
// Plugin registration pattern
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'extension-name:plugin',
  autoStart: true,
  requires: [ICommandPalette, ITranslator],
  activate: (app, palette, translator) => {
    // Register commands
    // Add UI components
    // Set up event handlers
  }
};
```

### 2. Backend Extension (Python)

**Purpose**: Provides server-side functionality, API endpoints, and business logic.

**Location**: Python package directory with underscores (e.g., `odh_jupyter_trash_cleanup/`)

**Key Responsibilities**:
- Register Jupyter Server extensions
- Handle HTTP API requests from frontend
- Execute privileged operations (file system access, system commands)
- Provide async operations for long-running tasks

**Entry Point**: `__init__.py` with standard Jupyter extension hooks:

```python
def _jupyter_labextension_paths():
    """Returns labextension metadata"""

def _jupyter_server_extension_points():
    """Returns server extension entry points"""

def _load_jupyter_server_extension(server_app):
    """Loads and configures the server extension"""
```

### 3. Labextension Bundle

**Purpose**: Frontend code packaged for distribution with the Python package.

**Location**: `{python_package}/labextension/`

**Generation**: Built by `jupyter labextension build` command during the build process.

**Distribution**: Included in the Python wheel, installed to Jupyter's shared labextensions directory.

---

## Component Breakdown

### odh-jupyter-trash-cleanup Extension

This section uses the trash cleanup extension as a reference implementation.

#### Frontend Components

```
src/
├── index.ts                    # Plugin registration and activation
├── emptyTrashCommand.ts        # Command logic (dialog, API call, notifications)
├── handler.ts                  # API request utility (requestAPI)
├── TrashIcon.tsx               # Icon component definition
├── ITrashEmptyResponse.ts      # TypeScript interface for API response
├── svg.d.ts                    # Type definitions for SVG imports
└── __tests__/                  # Jest unit tests
```

**Key Frontend Flow**:

1. **Plugin Activation** (`index.ts`):
   - Plugin is auto-started when JupyterLab loads
   - Registers command `odh-ide:clear-trash`
   - Adds command to command palette

2. **Command Execution** (`emptyTrashCommand.ts`):
   - Shows confirmation dialog
   - Calls backend API via `requestAPI`
   - Displays progress notification
   - Shows success/error messages with file count

3. **API Communication** (`handler.ts`):
   - Constructs URLs using JupyterLab's `URLExt.join()`
   - Namespace: `odh-jupyter-trash-cleanup`
   - Uses JupyterLab's `ServerConnection` for authenticated requests

#### Backend Components

```
odh_jupyter_trash_cleanup/
├── __init__.py                 # Extension registration
├── handlers.py                 # HTTP request handlers (Tornado)
├── trash.py                    # Business logic for trash operations
├── log.py                      # Logging utilities
├── test_empty_trash.py         # Pytest unit tests
├── tests/                      # Additional test files
├── labextension/               # Built frontend bundle (generated)
└── _version.py                 # Version info (auto-generated)
```

**Key Backend Flow**:

1. **Extension Loading**:
   - Jupyter Server discovers extension via `_jupyter_server_extension_points()`
   - Calls `_load_jupyter_server_extension()` to set up handlers
   - Registers HTTP routes with Tornado web application

2. **Request Handling** (`handlers.py`):
   - `RouteHandler` extends `APIHandler` from jupyter_server
   - Route pattern: `{base_url}/odh-jupyter-trash-cleanup/empty-trash`
   - POST method: authenticated, async operation
   - Returns JSON response: `{message: string, deleted: number}`

3. **Business Logic** (`trash.py`):
   - Follows XDG Base Directory specification
   - Trash location: `$XDG_DATA_HOME/Trash` or `~/.local/share/Trash`
   - Async deletion using `asyncio.to_thread()`
   - Security: Refuses to traverse symlinked directories
   - Deletes both `Trash/info/` (metadata) and `Trash/files/` (actual files)

#### Configuration and Schema

```
jupyter-config/
└── server-config/
    └── odh_jupyter_trash_cleanup.json    # Auto-enables extension

schema/
└── plugin.json                           # JupyterLab settings schema
```

**plugin.json** defines:
- Toolbar contributions (adds button to FileBrowser toolbar)
- Command mapping
- Button rank (display order)

#### Styles and Assets

```
style/
├── index.css                   # Main stylesheet (imports base.css)
├── index.js                    # Style module entry point
├── base.css                    # Extension-specific styles
└── icons/
    └── trash.svg               # Trash icon asset
```

---

## Communication Flow

### Frontend → Backend Request Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                         JupyterLab UI                             │
│                                                                   │
│  1. User clicks "Empty Trash" button                             │
│     └─→ Triggers command: 'odh-ide:clear-trash'                  │
│                                                                   │
│  2. emptyTrashCommand.execute()                                  │
│     ├─→ Shows confirmation dialog                                │
│     └─→ If confirmed, calls requestAPI()                         │
│                                                                   │
│  3. handler.requestAPI('empty-trash', {method: 'POST'})          │
│     └─→ Constructs URL: /odh-jupyter-trash-cleanup/empty-trash   │
│                                                                   │
│         ╔═══════════════════════════════════════╗                │
│         ║   HTTP POST Request (authenticated)   ║                │
│         ╚═══════════════════════════════════════╝                │
│                         │                                         │
│                         ▼                                         │
│         ┌─────────────────────────────────────┐                  │
│         │      Jupyter Server (Tornado)       │                  │
│         │                                      │                  │
│         │  4. RouteHandler.post()              │                  │
│         │     └─→ Trash.empty_trash()          │                  │
│         │         ├─→ Clear Trash/info/        │                  │
│         │         └─→ Clear Trash/files/       │                  │
│         │                                      │                  │
│         │  5. Returns JSON response:           │                  │
│         │     {deleted: int, message: str}     │                  │
│         └─────────────────────────────────────┘                  │
│                         │                                         │
│                         ▼                                         │
│         ╔═══════════════════════════════════════╗                │
│         ║        HTTP 200 OK Response           ║                │
│         ╚═══════════════════════════════════════╝                │
│                         │                                         │
│                         ▼                                         │
│  6. Notification.promise() resolves                              │
│     └─→ Shows success message: "N files removed"                 │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### Key Communication Patterns

1. **Authentication**: All requests use JupyterLab's `ServerConnection.makeRequest()` which handles authentication tokens automatically.

2. **Error Handling**:
   - Frontend: Try-catch in `requestAPI`, `ServerConnection.ResponseError` for HTTP errors
   - Backend: Exception handling in handlers, returns 500 with error message

3. **Async Operations**: Backend uses `async/await` with `asyncio.to_thread()` for file I/O to avoid blocking the event loop.

4. **Notifications**: Frontend uses JupyterLab's `Notification.promise()` pattern for async operation feedback.

---

## Build and Packaging Pipeline

### Development Build Process

```
┌─────────────────────────────────────────────────────────────────┐
│  Step 1: TypeScript Compilation                                 │
│  ────────────────────────────────────────────────────────────   │
│  tsc --sourceMap                                                │
│                                                                  │
│  src/*.ts  ──────────────────────────→  lib/*.js                │
│  src/*.tsx                               lib/*.d.ts             │
│                                          lib/*.js.map            │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│  Step 2: JupyterLab Extension Build                             │
│  ────────────────────────────────────────────────────────────   │
│  jupyter labextension build --development True .                │
│                                                                  │
│  Webpack bundles:                                               │
│  - lib/*.js                                                     │
│  - style/*.css                                                  │
│  - style/icons/*.svg                                            │
│  - schema/*.json                                                │
│                                                                  │
│  Output: odh_jupyter_trash_cleanup/labextension/                │
│          ├── static/                                            │
│          │   ├── style.js                                       │
│          │   └── [hash].js                                      │
│          ├── package.json                                       │
│          └── schemas/                                           │
│              └── plugin.json                                    │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│  Step 3: Extension Installation (Development)                   │
│  ────────────────────────────────────────────────────────────   │
│  pip install -e ".[test]"                                       │
│  jupyter labextension develop . --overwrite                     │
│  jupyter server extension enable odh_jupyter_trash_cleanup      │
│                                                                  │
│  Creates symlinks for hot-reload during development             │
└─────────────────────────────────────────────────────────────────┘
```

### Production Build Process

```
┌─────────────────────────────────────────────────────────────────┐
│  Step 1: Clean Build                                            │
│  ────────────────────────────────────────────────────────────   │
│  jlpm clean  (removes lib/, tsconfig.tsbuildinfo)               │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│  Step 2: Production TypeScript Build                            │
│  ────────────────────────────────────────────────────────────   │
│  tsc  (no source maps)                                          │
│                                                                  │
│  src/*.ts  ──────────────────────────────→  lib/*.js            │
│                                              lib/*.d.ts          │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│  Step 3: Production JupyterLab Build                            │
│  ────────────────────────────────────────────────────────────   │
│  jupyter labextension build .                                   │
│                                                                  │
│  Minified, optimized bundle in labextension/                    │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│  Step 4: Python Package Build (Hatchling)                       │
│  ────────────────────────────────────────────────────────────   │
│  python -m build                                                │
│                                                                  │
│  Creates:                                                       │
│  - dist/odh_jupyter_trash_cleanup-X.Y.Z.tar.gz (source)         │
│  - dist/odh_jupyter_trash_cleanup-X.Y.Z-py3-none-any.whl        │
│                                                                  │
│  Wheel includes:                                                │
│  - Python package (odh_jupyter_trash_cleanup/)                  │
│  - Labextension bundle (share/jupyter/labextensions/)           │
│  - Server config (etc/jupyter/jupyter_server_config.d/)         │
└─────────────────────────────────────────────────────────────────┘
```

### Turbo Build Orchestration

Turbo manages builds across the monorepo:

```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", "build/**"]
    }
  }
}
```

- `dependsOn: ["^build"]`: Ensures dependencies build first
- `outputs`: Defines cacheable artifacts
- Runs builds in parallel where possible
- Caches results in `.turbo/cache/`

---

## Extension Lifecycle

### 1. Installation Phase

```
User runs: pip install odh_jupyter_trash_cleanup
  │
  ├─→ Python package installed to site-packages/
  ├─→ Labextension copied to share/jupyter/labextensions/odh-jupyter-trash-cleanup/
  └─→ Server config copied to etc/jupyter/jupyter_server_config.d/
```

### 2. JupyterLab Startup Phase

```
jupyter lab
  │
  ├─→ Jupyter Server starts
  │   │
  │   └─→ Discovers server extensions from config:
  │       "jpserver_extensions": {"odh_jupyter_trash_cleanup": true}
  │       │
  │       └─→ Calls _load_jupyter_server_extension(server_app)
  │           │
  │           └─→ setup_handlers(web_app)
  │               └─→ Registers /odh-jupyter-trash-cleanup/* routes
  │
  └─→ JupyterLab frontend loads
      │
      └─→ Discovers labextensions from share/jupyter/labextensions/
          │
          └─→ Loads odh-jupyter-trash-cleanup plugin
              │
              ├─→ Reads package.json for metadata
              ├─→ Loads static/[hash].js bundle
              ├─→ Reads schema/plugin.json for settings
              │
              └─→ Calls plugin.activate()
                  │
                  ├─→ Registers commands
                  ├─→ Adds toolbar buttons (via schema)
                  └─→ Adds command palette items
```

### 3. Runtime Phase

```
User interacts with extension
  │
  ├─→ Frontend plugin handles UI events
  ├─→ Makes authenticated HTTP requests to backend
  ├─→ Backend processes requests
  └─→ Frontend updates UI based on responses
```

---

## File Structure and Naming Conventions

### Naming Rules

| Component | Pattern | Example |
|-----------|---------|---------|
| Extension directory | `odh-{purpose}` (kebab-case) | `odh-jupyter-trash-cleanup` |
| NPM package name | Same as directory | `odh-jupyter-trash-cleanup` |
| Python package name | Replace hyphens with underscores | `odh_jupyter_trash_cleanup` |
| Plugin ID | `{package}:plugin` | `odh-jupyter-trash-cleanup:plugin` |
| Command ID | `{namespace}:{action}` | `odh-ide:clear-trash` |
| API namespace | Same as NPM package | `odh-jupyter-trash-cleanup` |

### Directory Structure

```
odh-{extension-name}/
├── package.json                    # NPM package config + ESLint + Prettier
├── pyproject.toml                  # Python package config (hatchling)
├── setup.py                        # Minimal setup.py for editable installs
├── tsconfig.json                   # TypeScript compiler config
├── babel.config.js                 # Babel config for Jest
├── jest.config.js                  # Jest test config
├── install.json                    # JupyterLab extension install metadata
├── README.md                       # Extension documentation
├── CHANGELOG.md                    # Version history
├── RELEASE.md                      # Release process docs
├── LICENSE                         # Apache 2.0 license
│
├── src/                            # TypeScript source files
│   ├── index.ts                    # Plugin entry point
│   ├── *.ts                        # TypeScript modules
│   ├── *.tsx                       # React components
│   └── __tests__/                  # Jest tests
│
├── style/                          # CSS and assets
│   ├── index.css                   # Main stylesheet
│   ├── index.js                    # Style module entry
│   ├── base.css                    # Extension styles
│   └── icons/                      # SVG icons
│
├── schema/                         # JupyterLab settings schema
│   └── plugin.json                 # Settings and toolbar config
│
├── {python_package}/               # Python source (underscored name)
│   ├── __init__.py                 # Extension registration
│   ├── handlers.py                 # HTTP request handlers
│   ├── *.py                        # Business logic modules
│   ├── tests/                      # Pytest tests
│   ├── test_*.py                   # Additional pytest files
│   ├── labextension/               # Built frontend (generated)
│   └── _version.py                 # Auto-generated version
│
├── jupyter-config/                 # Jupyter configuration
│   └── server-config/
│       └── {python_package}.json   # Server extension config
│
├── ui-tests/                       # Playwright integration tests
│   ├── README.md
│   ├── package.json
│   ├── playwright.config.js
│   ├── jupyter_server_test_config.py
│   └── tests/                      # Test specs
│
├── lib/                            # Compiled TypeScript (generated)
│   ├── *.js
│   ├── *.d.ts
│   └── *.js.map
│
└── dist/                           # Python build artifacts (generated)
    ├── *.tar.gz
    └── *.whl
```

---

## Adding New Extensions

### Step-by-Step Guide

#### 1. Create Extension Scaffold

```bash
# From repository root
mkdir odh-{new-extension}
cd odh-{new-extension}

# Copy structure from existing extension
cp -r ../odh-jupyter-trash-cleanup/{package.json,pyproject.toml,tsconfig.json} .
```

#### 2. Update Package Metadata

**package.json**:
```json
{
  "name": "odh-{new-extension}",
  "version": "0.1.0",
  "description": "Description of new extension",
  "jupyterlab": {
    "extension": true,
    "outputDir": "odh_{new_extension}/labextension",
    "schemaDir": "schema",
    "discovery": {
      "server": {
        "base": {
          "name": "odh_{new_extension}"
        }
      }
    }
  }
}
```

**pyproject.toml**:
```toml
[project]
name = "odh_{new_extension}"
```

#### 3. Create Source Structure

```bash
mkdir -p src style schema odh_{new_extension} jupyter-config/server-config
```

#### 4. Implement Frontend Plugin

**src/index.ts**:
```typescript
import { JupyterFrontEndPlugin } from '@jupyterlab/application';

const plugin: JupyterFrontEndPlugin<void> = {
  id: 'odh-{new-extension}:plugin',
  description: 'Extension description',
  autoStart: true,
  activate: (app) => {
    console.log('Extension activated');
    // Add commands, UI components, etc.
  }
};

export default plugin;
```

#### 5. Implement Backend Extension

**odh_{new_extension}/__init__.py**:
```python
def _jupyter_labextension_paths():
    return [{"src": "labextension", "dest": "odh-{new-extension}"}]

def _jupyter_server_extension_points():
    return [{"module": "odh_{new_extension}"}]

def _load_jupyter_server_extension(server_app):
    from .handlers import setup_handlers
    setup_handlers(server_app.web_app)
    server_app.log.info("Registered odh_{new_extension} extension")
```

**odh_{new_extension}/handlers.py**:
```python
from jupyter_server.base.handlers import APIHandler
from jupyter_server.utils import url_path_join

class MyHandler(APIHandler):
    async def get(self):
        self.finish({"message": "Hello from backend"})

def setup_handlers(web_app):
    base_url = web_app.settings["base_url"]
    route_pattern = url_path_join(base_url, "odh-{new-extension}", "api")
    web_app.add_handlers(".*$", [(route_pattern, MyHandler)])
```

#### 6. Configure Server Auto-Enable

**jupyter-config/server-config/odh_{new_extension}.json**:
```json
{
  "ServerApp": {
    "jpserver_extensions": {
      "odh_{new_extension}": true
    }
  }
}
```

#### 7. Add to Monorepo Workspace

**Root package.json**:
```json
{
  "workspaces": [
    "odh-jupyter-trash-cleanup",
    "odh-{new-extension}"
  ]
}
```

#### 8. Install and Test

```bash
# From extension directory
pip install -e ".[test]"
jupyter labextension develop . --overwrite
jupyter server extension enable odh_{new_extension}

# Build and watch
jlpm watch

# In another terminal
jupyter lab
```

---

## Key Design Patterns

### 1. Command Pattern

Extensions register commands that can be invoked from multiple sources (toolbar, palette, shortcuts):

```typescript
commands.addCommand('extension:action', {
  label: 'Action Label',
  execute: () => { /* implementation */ }
});
```

### 2. Dependency Injection

JupyterLab plugins declare dependencies, which are injected during activation:

```typescript
const plugin: JupyterFrontEndPlugin<void> = {
  requires: [ICommandPalette, ITranslator],
  activate: (app, palette, translator) => { }
};
```

### 3. API Handler Pattern

Backend handlers extend `APIHandler` for consistent authentication and error handling:

```python
class Handler(APIHandler):
    @tornado.web.authenticated
    async def post(self):
        # Handle request
```

### 4. Async File Operations

Use `asyncio.to_thread()` for file I/O to avoid blocking:

```python
deleted = await asyncio.to_thread(self._clear_dir, path)
```

### 5. Notification Promise Pattern

Frontend uses promise-based notifications for async operations:

```typescript
Notification.promise(apiCall(), {
  pending: { message: 'Processing...' },
  success: { message: result => `Done: ${result}` },
  error: { message: () => 'Failed' }
});
```

---

## Security Considerations

### 1. Authentication

- All API requests use JupyterLab's authentication tokens
- Backend handlers decorated with `@tornado.web.authenticated`

### 2. Path Traversal Protection

- Extensions validate paths before file operations
- Refuse to traverse symlinked directories
- Use Path operations instead of string concatenation

### 3. Input Validation

- API handlers validate request parameters
- Use type checking on both frontend and backend

### 4. Error Handling

- Never expose sensitive information in error messages
- Log detailed errors server-side
- Return user-friendly messages to frontend

---

This architecture document should be updated as new patterns emerge or extensions are added. For extension-specific details, refer to the extension's README.md file.
