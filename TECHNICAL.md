# Registry Browser - Technical Documentation

## Overview
Registry Browser is a cross-platform desktop application for browsing Docker registries without requiring Docker to be installed. It communicates directly with Docker Registry HTTP API V2.

## Architecture

### Technology Stack
- **Frontend**: HTML/CSS/JavaScript (vanilla, no frameworks)
- **Backend**: Electron + TypeScript (Node.js)
- **HTTP Client**: Axios
- **Storage**: electron-store (OS-specific secure storage)
- **Build Tool**: electron-builder
- **Testing**: Jest with ts-jest
- **CI/CD**: GitHub Actions

### Project Structure
```
RegistryBrowser/
├── src/
│   ├── main/           # Electron main process (TypeScript)
│   │   ├── main.ts     # Main process entry point
│   │   └── preload.ts  # IPC bridge (contextBridge)
│   ├── lib/
│   │   └── registryClient.ts  # Docker Registry API client
│   └── renderer/       # UI (plain JavaScript)
│       ├── index.html  # UI markup and styles
│       └── renderer.js # UI logic
├── tests/              # Jest tests
│   ├── registryClient.test.ts  # API client tests
│   └── ipcHandlers.test.ts     # IPC handler tests
├── dist/               # Compiled output (gitignored)
├── release/            # Packaged apps (gitignored)
├── build.js            # Custom build script
├── tsconfig.json       # TypeScript configuration
├── jest.config.js      # Jest configuration
└── package.json        # npm configuration

```

## Security Features

### Electron Security
1. **Context Isolation**: Enabled to separate renderer and main process contexts
2. **Node Integration**: Disabled in renderer process
3. **Preload Script**: Uses `contextBridge` to expose only specific APIs
4. **Content Security Policy**: Configured in HTML to prevent XSS

### Credential Storage
- Uses `electron-store` which stores credentials in OS-specific secure locations:
  - **Windows**: `%APPDATA%\registry-browser\config.json`
  - **macOS**: `~/Library/Application Support/registry-browser/config.json`
  - **Linux**: `~/.config/registry-browser/config.json`

### GitHub Actions
- Minimal permissions (contents: write, actions: read)
- Separate permissions per job
- No secrets exposed in logs

## API Integration

### Docker Registry HTTP API V2
The application implements these endpoints:

1. **GET /v2/**: Test connection and authentication
2. **GET /v2/_catalog**: List all repositories
3. **GET /v2/{repository}/tags/list**: List tags for a repository
4. **GET /v2/{repository}/manifests/{tag}**: Get manifest for a specific tag

### Authentication
- Supports HTTP Basic Authentication
- Credentials are optional (for public registries)
- Credentials stored securely when "Save credentials" is checked

## Build Process

### Development Build
```bash
npm run build   # Compiles TypeScript, copies renderer files
npm start       # Starts Electron in development mode
```

### Production Build
```bash
npm run package           # Build for current platform
npm run package:win       # Build Windows installer
npm run package:mac       # Build macOS DMG (Intel + ARM)
npm run package:linux     # Build Linux AppImage and deb
```

### Build Script (build.js)
1. Compiles TypeScript (main + lib) to CommonJS
2. Copies renderer.js (plain JavaScript) to dist/
3. Copies and updates index.html with correct script paths

## Testing

### Test Coverage
- **41 tests total**
- **registryClient.test.ts**: 29 tests covering all API methods
- **ipcHandlers.test.ts**: 12 tests covering all IPC handlers

### Running Tests
```bash
npm test                  # Run all tests
npm run test:watch        # Run in watch mode
npm run test:coverage     # Generate coverage report
```

### Test Strategy
- Unit tests for RegistryClient with mocked HTTP responses
- Integration tests for IPC handlers with mocked dependencies
- Uses axios-mock-adapter for HTTP mocking
- Uses Jest mocks for Electron modules

## CI/CD Pipeline

### GitHub Actions Workflow
1. **Build Job** (runs on Windows, macOS, Linux in parallel):
   - Checkout code
   - Setup Node.js 20
   - Install dependencies (npm ci)
   - Build application
   - Package for platform
   - Upload artifacts

2. **Release Job** (runs only on tags):
   - Download all artifacts
   - Create GitHub release
   - Attach all platform binaries

### Triggering Releases
- Push a tag: `git tag v1.0.0 && git push --tags`
- Or use workflow_dispatch for manual triggers

## User Guide

### Connecting to a Registry
1. Enter registry URL (e.g., `https://registry.example.com`)
2. Enter username and password (optional for public registries)
3. Check "Save credentials locally" to persist (optional)
4. Click "Connect"

### Browsing
- **Repositories**: Listed in left sidebar
- **Tags**: Click a repository to view its tags
- **Manifests**: Click a tag to view its manifest details

### About Dialog
- Shows application version
- Shows license (MIT)
- Accessible from header button

## Development Notes

### Why Plain JavaScript for Renderer?
TypeScript compiles to CommonJS by default, which uses `exports` that browsers don't understand. We chose plain JavaScript for the renderer to avoid bundling complexity while keeping TypeScript for the main process.

### Path Handling
The application detects if it's running in development (`!app.isPackaged`) or production and adjusts file paths accordingly:
- **Development**: Files are in `src/`
- **Production**: Files are packaged in app.asar or extracted

### IPC Pattern
All IPC uses the secure `invoke/handle` pattern:
1. Renderer calls `window.electronAPI.method()`
2. Preload exposes via `contextBridge`
3. Main process handles via `ipcMain.handle()`
4. Returns `{success, data}` or `{success: false, error}`

## Troubleshooting

### "ERR_FILE_NOT_FOUND" on startup
- Run `npm run build` to ensure dist/ is populated
- Check that HTML path logic in main.ts is correct

### "exports is not defined"
- Ensure renderer.js is plain JavaScript, not compiled TypeScript
- Check that build.js copies renderer.js correctly

### Buttons don't work
- Check browser console for JavaScript errors
- Verify preload.js is loaded (check webPreferences)
- Ensure window.electronAPI is available

### Build fails
- Check Node.js version (20+)
- Run `npm ci` to ensure clean dependencies
- Check for platform-specific requirements (electron-builder docs)

## License
MIT License - See LICENSE file for details
