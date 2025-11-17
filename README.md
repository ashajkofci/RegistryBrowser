# RegistryBrowser

A cross-platform desktop application for browsing Docker registries without requiring Docker to be installed.

## Features

- 🐳 Browse any custom Docker registry
- 📦 View repositories, tags, and image manifests
- 🔐 Secure authentication with username and password
- 💾 Optional credential storage (OS-specific secure storage)
- 🚀 No Docker installation required
- 🖥️ Cross-platform support: Windows, macOS (Intel & ARM), and Linux
- 📄 MIT Licensed

## Installation

Download the latest release for your platform:
- **Windows**: Download the `.exe` installer
- **macOS**: Download the `.dmg` file
- **Linux**: Download the `.AppImage` or `.deb` package

## Usage

1. Launch the application
2. Enter your Docker registry URL (e.g., `https://registry.example.com`)
3. Provide your username and password
4. Optionally check "Save credentials locally" to remember your credentials
5. Click "Connect"
6. Browse repositories and their tags
7. Click on tags to view manifest details

## Development

### Prerequisites

- Node.js 16+ 
- npm

### Setup

```bash
npm install
```

### Build

```bash
npm run build
```

### Run

```bash
npm start
```

### Package

```bash
# Package for all platforms
npm run package

# Package for specific platforms
npm run package:win     # Windows
npm run package:mac     # macOS
npm run package:linux   # Linux
```

### Test

```bash
npm test
npm run test:coverage
```

## Release Process

The project includes an automated release pipeline via GitHub Actions that handles:
1. **Testing** - Runs all tests with coverage
2. **Version Bumping** - Automatically increments version (patch/minor/major)
3. **Building & Packaging** - Compiles and packages for Windows, macOS, and Linux
4. **Release** - Creates a GitHub release with all platform packages

To trigger a release:
1. Go to Actions tab in GitHub
2. Select "Test, Version Bump, Build and Release" workflow
3. Click "Run workflow"
4. Choose version bump type (patch, minor, or major)
5. The workflow will automatically test, bump version, build, and release

## How It Works

Registry Browser uses the Docker Registry HTTP API V2 to communicate directly with Docker registries. It doesn't require Docker to be installed because it implements the registry protocol directly using HTTP requests.

## Security

- Credentials are stored using `electron-store`, which stores data in OS-specific secure directories
- All communication with registries uses HTTPS (recommended)
- Basic authentication is supported

## License

MIT License - see [LICENSE](LICENSE) file for details

## About

Registry Browser is a tool for DevOps engineers and developers who need to browse Docker registries without having Docker installed on their machines.
