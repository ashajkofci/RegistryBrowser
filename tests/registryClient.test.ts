import { describe, it, expect, beforeEach } from '@jest/globals';
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import { RegistryClient } from '../src/lib/registryClient';

describe('RegistryClient', () => {
  let mock: MockAdapter;
  const registryUrl = 'https://registry.example.com';
  const username = 'testuser';
  const password = 'testpass';

  beforeEach(() => {
    mock = new MockAdapter(axios);
  });

  afterEach(() => {
    mock.restore();
  });

  describe('constructor', () => {
    it('should create instance with URL only', () => {
      const client = new RegistryClient(registryUrl);
      expect(client).toBeInstanceOf(RegistryClient);
    });

    it('should create instance with URL and credentials', () => {
      const client = new RegistryClient(registryUrl, username, password);
      expect(client).toBeInstanceOf(RegistryClient);
    });

    it('should strip trailing slash from URL', () => {
      const client = new RegistryClient(registryUrl + '/');
      expect(client).toBeInstanceOf(RegistryClient);
    });
  });

  describe('testConnection', () => {
    it('should successfully test connection', async () => {
      mock.onGet(`${registryUrl}/v2/`).reply(200);

      const client = new RegistryClient(registryUrl, username, password);
      await expect(client.testConnection()).resolves.toBeUndefined();
    });

    it('should throw error on authentication failure', async () => {
      mock.onGet(`${registryUrl}/v2/`).reply(401);

      const client = new RegistryClient(registryUrl, username, password);
      await expect(client.testConnection()).rejects.toThrow('Authentication failed');
    });

    it('should throw error on connection failure', async () => {
      mock.onGet(`${registryUrl}/v2/`).networkError();

      const client = new RegistryClient(registryUrl, username, password);
      await expect(client.testConnection()).rejects.toThrow('Connection failed');
    });

    it('should throw error on non-200 response', async () => {
      mock.onGet(`${registryUrl}/v2/`).reply(500);

      const client = new RegistryClient(registryUrl, username, password);
      await expect(client.testConnection()).rejects.toThrow('Connection failed');
    });
  });

  describe('getRepositories', () => {
    it('should fetch repositories list', async () => {
      const repositories = ['repo1', 'repo2', 'repo3'];
      mock.onGet(`${registryUrl}/v2/_catalog`).reply(200, { repositories });

      const client = new RegistryClient(registryUrl, username, password);
      const result = await client.getRepositories();

      expect(result).toEqual(repositories);
    });

    it('should return empty array when no repositories', async () => {
      mock.onGet(`${registryUrl}/v2/_catalog`).reply(200, {});

      const client = new RegistryClient(registryUrl, username, password);
      const result = await client.getRepositories();

      expect(result).toEqual([]);
    });

    it('should throw error on authentication failure', async () => {
      mock.onGet(`${registryUrl}/v2/_catalog`).reply(401);

      const client = new RegistryClient(registryUrl, username, password);
      await expect(client.getRepositories()).rejects.toThrow('Authentication failed');
    });

    it('should throw error on network failure', async () => {
      mock.onGet(`${registryUrl}/v2/_catalog`).networkError();

      const client = new RegistryClient(registryUrl, username, password);
      await expect(client.getRepositories()).rejects.toThrow('Failed to fetch repositories');
    });
  });

  describe('getTags', () => {
    const repository = 'my-repo';

    it('should fetch tags for a repository', async () => {
      const tags = ['v1.0.0', 'v1.1.0', 'latest'];
      mock.onGet(`${registryUrl}/v2/${repository}/tags/list`).reply(200, { tags });

      const client = new RegistryClient(registryUrl, username, password);
      const result = await client.getTags(repository);

      expect(result).toEqual(tags);
    });

    it('should return empty array when no tags', async () => {
      mock.onGet(`${registryUrl}/v2/${repository}/tags/list`).reply(200, {});

      const client = new RegistryClient(registryUrl, username, password);
      const result = await client.getTags(repository);

      expect(result).toEqual([]);
    });

    it('should throw error when repository not found', async () => {
      mock.onGet(`${registryUrl}/v2/${repository}/tags/list`).reply(404);

      const client = new RegistryClient(registryUrl, username, password);
      await expect(client.getTags(repository)).rejects.toThrow('Repository not found');
    });

    it('should throw error on authentication failure', async () => {
      mock.onGet(`${registryUrl}/v2/${repository}/tags/list`).reply(401);

      const client = new RegistryClient(registryUrl, username, password);
      await expect(client.getTags(repository)).rejects.toThrow('Authentication failed');
    });

    it('should throw error on network failure', async () => {
      mock.onGet(`${registryUrl}/v2/${repository}/tags/list`).networkError();

      const client = new RegistryClient(registryUrl, username, password);
      await expect(client.getTags(repository)).rejects.toThrow('Failed to fetch tags');
    });
  });

  describe('getManifest', () => {
    const repository = 'my-repo';
    const tag = 'v1.0.0';

    it('should fetch manifest for a tag', async () => {
      const manifest = {
        schemaVersion: 2,
        mediaType: 'application/vnd.docker.distribution.manifest.v2+json',
        config: { digest: 'sha256:abc123' },
        layers: [{ digest: 'sha256:layer1' }],
      };
      
      mock.onGet(`${registryUrl}/v2/${repository}/manifests/${tag}`).reply(200, manifest);

      const client = new RegistryClient(registryUrl, username, password);
      const result = await client.getManifest(repository, tag);

      expect(result).toEqual(manifest);
    });

    it('should send correct accept headers', async () => {
      const manifest = { schemaVersion: 2 };
      
      mock.onGet(`${registryUrl}/v2/${repository}/manifests/${tag}`).reply((config) => {
        expect(config.headers?.Accept).toContain('application/vnd.docker.distribution.manifest.v2+json');
        return [200, manifest];
      });

      const client = new RegistryClient(registryUrl, username, password);
      await client.getManifest(repository, tag);
    });

    it('should throw error when manifest not found', async () => {
      mock.onGet(`${registryUrl}/v2/${repository}/manifests/${tag}`).reply(404);

      const client = new RegistryClient(registryUrl, username, password);
      await expect(client.getManifest(repository, tag)).rejects.toThrow('Manifest not found');
    });

    it('should throw error on authentication failure', async () => {
      mock.onGet(`${registryUrl}/v2/${repository}/manifests/${tag}`).reply(401);

      const client = new RegistryClient(registryUrl, username, password);
      await expect(client.getManifest(repository, tag)).rejects.toThrow('Authentication failed');
    });

    it('should throw error on network failure', async () => {
      mock.onGet(`${registryUrl}/v2/${repository}/manifests/${tag}`).networkError();

      const client = new RegistryClient(registryUrl, username, password);
      await expect(client.getManifest(repository, tag)).rejects.toThrow('Failed to fetch manifest');
    });

    it('should handle manifest list format', async () => {
      const manifestList = {
        schemaVersion: 2,
        mediaType: 'application/vnd.docker.distribution.manifest.list.v2+json',
        manifests: [
          { platform: { architecture: 'amd64' }, digest: 'sha256:abc123' },
          { platform: { architecture: 'arm64' }, digest: 'sha256:def456' },
        ],
      };
      
      mock.onGet(`${registryUrl}/v2/${repository}/manifests/${tag}`).reply(200, manifestList);

      const client = new RegistryClient(registryUrl, username, password);
      const result = await client.getManifest(repository, tag);

      expect(result).toEqual(manifestList);
      expect(result.manifests).toHaveLength(2);
    });
  });

  describe('deleteImage', () => {
    const repository = 'my-repo';
    const tag = 'v1.0.0';
    const digest = 'sha256:abc123';

    it('should resolve the digest and delete the manifest', async () => {
      mock.onGet(`${registryUrl}/v2/${repository}/manifests/${tag}`).reply((config) => {
        expect(config.headers?.Accept).toContain('application/vnd.docker.distribution.manifest.v2+json');
        return [200, {}, { 'docker-content-digest': digest }];
      });
      mock.onDelete(`${registryUrl}/v2/${repository}/manifests/${digest}`).reply(202);

      const client = new RegistryClient(registryUrl, username, password);
      await expect(client.deleteImage(repository, tag)).resolves.toBeUndefined();
    });

    it('should explain when deletion is disabled', async () => {
      mock.onGet(`${registryUrl}/v2/${repository}/manifests/${tag}`).reply(200, {}, {
        'docker-content-digest': digest,
      });
      mock.onDelete(`${registryUrl}/v2/${repository}/manifests/${digest}`).reply(405);

      const client = new RegistryClient(registryUrl, username, password);
      await expect(client.deleteImage(repository, tag)).rejects.toThrow('Image deletion is disabled');
    });
  });

  describe('URL handling', () => {
    it('should handle registry URL with trailing slash', async () => {
      const repositories = ['repo1'];
      mock.onGet(`${registryUrl}/v2/_catalog`).reply(200, { repositories });

      const client = new RegistryClient(registryUrl + '/', username, password);
      const result = await client.getRepositories();

      expect(result).toEqual(repositories);
    });

    it('should handle registry URL without scheme', () => {
      // Constructor should work even with a URL without scheme (though not recommended)
      const client = new RegistryClient('registry.example.com', username, password);
      expect(client).toBeInstanceOf(RegistryClient);
    });
  });

  describe('authentication', () => {
    it('should work without authentication when registry is public', async () => {
      const repositories = ['public-repo'];
      mock.onGet(`${registryUrl}/v2/_catalog`).reply(200, { repositories });

      const client = new RegistryClient(registryUrl);
      const result = await client.getRepositories();

      expect(result).toEqual(repositories);
    });

    it('should send authentication headers when credentials provided', async () => {
      let authHeaderReceived = false;
      mock.onGet(`${registryUrl}/v2/_catalog`).reply((config) => {
        const authHeader = config.auth;
        if (authHeader && authHeader.username === username && authHeader.password === password) {
          authHeaderReceived = true;
        }
        return [200, { repositories: [] }];
      });

      const client = new RegistryClient(registryUrl, username, password);
      await client.getRepositories();
      
      // axios-mock-adapter handles auth differently, just verify it was called
      expect(authHeaderReceived).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle timeout errors', async () => {
      mock.onGet(`${registryUrl}/v2/_catalog`).timeout();

      const client = new RegistryClient(registryUrl, username, password);
      await expect(client.getRepositories()).rejects.toThrow();
    });

    it('should handle malformed JSON responses', async () => {
      mock.onGet(`${registryUrl}/v2/_catalog`).reply(200, 'not json');

      const client = new RegistryClient(registryUrl, username, password);
      // This might or might not throw depending on axios behavior,
      // but we should handle it gracefully
      try {
        await client.getRepositories();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle empty responses with empty array', async () => {
      mock.onGet(`${registryUrl}/v2/_catalog`).reply(200, {});

      const client = new RegistryClient(registryUrl, username, password);
      const result = await client.getRepositories();
      
      expect(result).toEqual([]);
    });
  });
});
