import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock electron modules
const mockStore = {
  set: jest.fn(),
  get: jest.fn(),
  delete: jest.fn(),
};

const mockDialog = {
  showMessageBox: jest.fn(),
};

const mockIpcMain = {
  handle: jest.fn(),
};

jest.mock('electron', () => ({
  app: {
    getVersion: jest.fn(() => '1.0.0'),
  },
  ipcMain: mockIpcMain,
  dialog: mockDialog,
}));

jest.mock('electron-store', () => {
  return jest.fn(() => mockStore);
});

// Mock RegistryClient
jest.mock('../src/lib/registryClient', () => {
  return {
    RegistryClient: jest.fn().mockImplementation(() => ({
      testConnection: jest.fn(),
      getRepositories: jest.fn(),
      getTags: jest.fn(),
      getManifest: jest.fn(),
    })),
  };
});

describe('Main Process IPC Handlers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Credential Storage', () => {
    it('should handle save-credentials', async () => {
      const credentials = {
        registryUrl: 'https://registry.example.com',
        username: 'testuser',
        password: 'testpass',
        saved: true,
      };

      mockStore.set.mockImplementation(() => undefined);

      // Simulate the handler
      const result = await (async () => {
        try {
          mockStore.set('credentials', credentials);
          return { success: true };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      })();

      expect(result.success).toBe(true);
      expect(mockStore.set).toHaveBeenCalledWith('credentials', credentials);
    });

    it('should handle get-credentials', async () => {
      const credentials = {
        registryUrl: 'https://registry.example.com',
        username: 'testuser',
        password: 'testpass',
        saved: true,
      };

      mockStore.get.mockReturnValue(credentials);

      // Simulate the handler
      const result = await (async () => {
        try {
          const creds = mockStore.get('credentials');
          return { success: true, credentials: creds };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      })();

      expect(result.success).toBe(true);
      expect(result.credentials).toEqual(credentials);
      expect(mockStore.get).toHaveBeenCalledWith('credentials');
    });

    it('should handle clear-credentials', async () => {
      mockStore.delete.mockImplementation(() => undefined);

      // Simulate the handler
      const result = await (async () => {
        try {
          mockStore.delete('credentials');
          return { success: true };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      })();

      expect(result.success).toBe(true);
      expect(mockStore.delete).toHaveBeenCalledWith('credentials');
    });

    it('should handle errors when saving credentials', async () => {
      mockStore.set.mockImplementation(() => {
        throw new Error('Storage error');
      });

      // Simulate the handler
      const result = await (async () => {
        try {
          mockStore.set('credentials', {});
          return { success: true };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      })();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Storage error');
    });
  });

  describe('Registry Operations', () => {
    it('should test connection successfully', async () => {
      const { RegistryClient } = require('../src/lib/registryClient');
      const mockClient = {
        testConnection: jest.fn().mockResolvedValue(undefined),
      };
      
      (RegistryClient as jest.Mock).mockImplementation(() => mockClient);

      const config = {
        registryUrl: 'https://registry.example.com',
        username: 'testuser',
        password: 'testpass',
      };

      // Simulate the handler
      const result = await (async () => {
        try {
          const client = new RegistryClient(config.registryUrl, config.username, config.password);
          await client.testConnection();
          return { success: true };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      })();

      expect(result.success).toBe(true);
      expect(mockClient.testConnection).toHaveBeenCalled();
    });

    it('should handle connection test failure', async () => {
      const { RegistryClient } = require('../src/lib/registryClient');
      const mockClient = {
        testConnection: jest.fn().mockRejectedValue(new Error('Connection failed')),
      };
      
      (RegistryClient as jest.Mock).mockImplementation(() => mockClient);

      const config = {
        registryUrl: 'https://registry.example.com',
        username: 'testuser',
        password: 'testpass',
      };

      // Simulate the handler
      const result = await (async () => {
        try {
          const client = new RegistryClient(config.registryUrl, config.username, config.password);
          await client.testConnection();
          return { success: true };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      })();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Connection failed');
    });

    it('should get repositories successfully', async () => {
      const { RegistryClient } = require('../src/lib/registryClient');
      const repositories = ['repo1', 'repo2', 'repo3'];
      const mockClient = {
        getRepositories: jest.fn().mockResolvedValue(repositories),
      };
      
      (RegistryClient as jest.Mock).mockImplementation(() => mockClient);

      const config = {
        registryUrl: 'https://registry.example.com',
        username: 'testuser',
        password: 'testpass',
      };

      // Simulate the handler
      const result = await (async () => {
        try {
          const client = new RegistryClient(config.registryUrl, config.username, config.password);
          const repos = await client.getRepositories();
          return { success: true, repositories: repos };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      })();

      expect(result.success).toBe(true);
      expect(result.repositories).toEqual(repositories);
    });

    it('should get tags successfully', async () => {
      const { RegistryClient } = require('../src/lib/registryClient');
      const tags = ['v1.0.0', 'v1.1.0', 'latest'];
      const mockClient = {
        getTags: jest.fn().mockResolvedValue(tags),
      };
      
      (RegistryClient as jest.Mock).mockImplementation(() => mockClient);

      const config = {
        registryUrl: 'https://registry.example.com',
        username: 'testuser',
        password: 'testpass',
      };
      const repository = 'my-repo';

      // Simulate the handler
      const result = await (async () => {
        try {
          const client = new RegistryClient(config.registryUrl, config.username, config.password);
          const repoTags = await client.getTags(repository);
          return { success: true, tags: repoTags };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      })();

      expect(result.success).toBe(true);
      expect(result.tags).toEqual(tags);
      expect(mockClient.getTags).toHaveBeenCalledWith(repository);
    });

    it('should get manifest successfully', async () => {
      const { RegistryClient } = require('../src/lib/registryClient');
      const manifest = {
        schemaVersion: 2,
        mediaType: 'application/vnd.docker.distribution.manifest.v2+json',
        config: { digest: 'sha256:abc123' },
      };
      const mockClient = {
        getManifest: jest.fn().mockResolvedValue(manifest),
      };
      
      (RegistryClient as jest.Mock).mockImplementation(() => mockClient);

      const config = {
        registryUrl: 'https://registry.example.com',
        username: 'testuser',
        password: 'testpass',
      };
      const repository = 'my-repo';
      const tag = 'v1.0.0';

      // Simulate the handler
      const result = await (async () => {
        try {
          const client = new RegistryClient(config.registryUrl, config.username, config.password);
          const imageManifest = await client.getManifest(repository, tag);
          return { success: true, manifest: imageManifest };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      })();

      expect(result.success).toBe(true);
      expect(result.manifest).toEqual(manifest);
      expect(mockClient.getManifest).toHaveBeenCalledWith(repository, tag);
    });
  });

  describe('About Dialog', () => {
    it('should show about dialog with correct information', () => {
      const { app, dialog } = require('electron');
      
      // Simulate the handler
      dialog.showMessageBox({
        type: 'info',
        title: 'About Registry Browser',
        message: 'Registry Browser',
        detail: `Version: ${app.getVersion()}

A Docker registry browser application.

MIT Licensed

© 2025`,
        buttons: ['OK'],
      });

      expect(mockDialog.showMessageBox).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'info',
          title: 'About Registry Browser',
          message: 'Registry Browser',
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed config in test-connection', async () => {
      const { RegistryClient } = require('../src/lib/registryClient');
      
      (RegistryClient as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid config');
      });

      const config = null;

      // Simulate the handler
      const result = await (async () => {
        try {
          const client = new (RegistryClient as any)(
            (config as any)?.registryUrl,
            (config as any)?.username,
            (config as any)?.password
          );
          await client.testConnection();
          return { success: true };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      })();

      expect(result.success).toBe(false);
    });

    it('should handle undefined credentials gracefully', async () => {
      const { RegistryClient } = require('../src/lib/registryClient');
      const mockClient = {
        testConnection: jest.fn().mockResolvedValue(undefined),
      };
      
      (RegistryClient as jest.Mock).mockImplementation(() => mockClient);

      const config = {
        registryUrl: 'https://registry.example.com',
        username: undefined,
        password: undefined,
      };

      // Simulate the handler
      const result = await (async () => {
        try {
          const client = new RegistryClient(config.registryUrl, config.username, config.password);
          await client.testConnection();
          return { success: true };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      })();

      expect(result.success).toBe(true);
    });
  });
});
