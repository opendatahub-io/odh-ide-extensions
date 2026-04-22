# OpenDataHub IDE Extensions

![GitHub License](https://img.shields.io/github/license/opendatahub-io/odh-ide-extensions)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/opendatahub-io/odh-ide-extensions/HEAD)
[![codecov](https://codecov.io/gh/opendatahub-io/odh-ide-extensions/branch/main/graph/badge.svg)](https://codecov.io/gh/opendatahub-io/odh-ide-extensions)

Welcome to the OpenDataHub IDE Extensions repository! This repository is a collection of IDE extensions for the Open Data Hub ecosystem, providing enhanced functionality for data science and development workflows.

## Extensions

### [odh-jupyter-trash-cleanup](./odh-jupyter-trash-cleanup/)

A JupyterLab extension that provides a convenient way to empty the Trash directory directly from the JupyterLab UI. This extension helps users manage their workspace by permanently removing deleted files.

**Key Features:**

- One-click trash cleanup from JupyterLab interface
- Follows XDG Base Directory specification
- Server and frontend components for seamless integration

## Repository Structure

This is a monorepo managed with [Turbo](https://turbo.build/) for efficient build orchestration and workspace management.

```text
odh-ide-extensions/
├── odh-jupyter-trash-cleanup/    # JupyterLab trash cleanup extension
├── docs/
│   └── ARCHITECTURE.md           # Detailed architecture documentation
├── package.json                   # Root workspace configuration
├── turbo.json                     # Turbo build configuration
├── CLAUDE.md                      # AI assistant guidance
└── README.md                      # This file
```

## Documentation

- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)**: Comprehensive architecture documentation covering component structure, communication patterns, build pipeline, and extension development guide
- **[CLAUDE.md](CLAUDE.md)**: Quick reference for AI assistants working with this codebase

## Development Setup

### Prerequisites

- Node.js (version specified in package.json)
- Python 3.8+ (for Python-based extensions)
- npm or yarn

### Getting Started

1. **Clone the repository:**

   ```bash
   git clone https://github.com/opendatahub-io/odh-ide-extensions.git
   cd odh-ide-extensions
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Build all extensions:**
   ```bash
   npm run build
   ```

### Available Scripts

- `npm run build` - Build all extensions in development mode
- `npm run build:prod` - Build all extensions for production
- `npm run lint` - Lint all extensions
- `npm run test` - Run tests for all extensions

## Contributing

We welcome contributions to improve and expand the Open Data Hub IDE extensions ecosystem!

### Adding New Extensions

To add a new extension to this monorepo:

1. Create a new directory for your extension
2. Add the extension name to the `workspaces` array in `package.json`
3. Follow the existing extension structure and conventions
4. Update this README to include your extension

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.
