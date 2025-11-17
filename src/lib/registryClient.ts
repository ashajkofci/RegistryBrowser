import axios, { AxiosInstance } from 'axios';

export interface Repository {
  name: string;
}

export interface Tag {
  name: string;
}

export interface Manifest {
  schemaVersion: number;
  mediaType?: string;
  config?: any;
  layers?: any[];
  manifests?: any[];
  [key: string]: any;
}

export class RegistryClient {
  private client: AxiosInstance;
  private registryUrl: string;

  constructor(registryUrl: string, username?: string, password?: string) {
    // Ensure URL doesn't end with /
    this.registryUrl = registryUrl.replace(/\/$/, '');
    
    this.client = axios.create({
      baseURL: this.registryUrl,
      timeout: 30000,
      headers: {
        'Accept': 'application/json',
      },
    });

    // Add authentication if provided
    if (username && password) {
      this.client.defaults.auth = {
        username,
        password,
      };
    }
  }

  async testConnection(): Promise<void> {
    try {
      // Try to access the v2 endpoint
      const response = await this.client.get('/v2/');
      if (response.status !== 200) {
        throw new Error('Registry not responding correctly');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Authentication failed. Please check your credentials.');
        }
        throw new Error(`Connection failed: ${error.message}`);
      }
      throw error;
    }
  }

  async getRepositories(): Promise<string[]> {
    try {
      const response = await this.client.get('/v2/_catalog');
      return response.data.repositories || [];
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Authentication failed');
        }
        throw new Error(`Failed to fetch repositories: ${error.message}`);
      }
      throw error;
    }
  }

  async getTags(repository: string): Promise<string[]> {
    try {
      const response = await this.client.get(`/v2/${repository}/tags/list`);
      return response.data.tags || [];
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error('Repository not found');
        }
        if (error.response?.status === 401) {
          throw new Error('Authentication failed');
        }
        throw new Error(`Failed to fetch tags: ${error.message}`);
      }
      throw error;
    }
  }

  async getManifest(repository: string, tag: string): Promise<Manifest> {
    try {
      const response = await this.client.get(`/v2/${repository}/manifests/${tag}`, {
        headers: {
          'Accept': 'application/vnd.docker.distribution.manifest.v2+json, application/vnd.docker.distribution.manifest.list.v2+json, application/vnd.oci.image.manifest.v1+json',
        },
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error('Manifest not found');
        }
        if (error.response?.status === 401) {
          throw new Error('Authentication failed');
        }
        throw new Error(`Failed to fetch manifest: ${error.message}`);
      }
      throw error;
    }
  }
}
