/**
 * Unit tests for the handler module - testing requestAPI function
 */

import { ServerConnection } from '@jupyterlab/services';

jest.mock('@jupyterlab/services', () => ({
  ServerConnection: {
    makeSettings: jest.fn(),
    makeRequest: jest.fn(),
    NetworkError: class NetworkError extends Error {
      constructor(error: Error) {
        super(error.message);
        this.name = 'NetworkError';
      }
    },
    ResponseError: class ResponseError extends Error {
      response: Response;
      constructor(response: Response, message: string) {
        super(message);
        this.name = 'ResponseError';
        this.response = response;
      }
    }
  }
}));

jest.mock('@jupyterlab/coreutils', () => ({
  URLExt: {
    join: (...parts: string[]) => parts.filter(Boolean).join('/')
  }
}));

import { requestAPI } from '../handler';

describe('handler module', () => {
  const mockSettings = { baseUrl: 'http://localhost:8888/' };

  beforeEach(() => {
    jest.clearAllMocks();
    (ServerConnection.makeSettings as jest.Mock).mockReturnValue(mockSettings);
  });

  describe('requestAPI', () => {
    it('should make request with correct URL', async () => {
      const mockResponse = {
        ok: true,
        text: jest.fn().mockResolvedValue('{"success": true}')
      };
      (ServerConnection.makeRequest as jest.Mock).mockResolvedValue(
        mockResponse
      );

      await requestAPI('empty-trash');

      expect(ServerConnection.makeRequest).toHaveBeenCalledWith(
        expect.stringContaining('odh-jupyter-trash-cleanup'),
        {},
        mockSettings
      );
      expect(ServerConnection.makeRequest).toHaveBeenCalledWith(
        expect.stringContaining('empty-trash'),
        {},
        mockSettings
      );
    });

    it('should return parsed JSON response', async () => {
      const mockData = { deleted: 5, message: 'Trash emptied' };
      const mockResponse = {
        ok: true,
        text: jest.fn().mockResolvedValue(JSON.stringify(mockData))
      };
      (ServerConnection.makeRequest as jest.Mock).mockResolvedValue(
        mockResponse
      );

      const result = await requestAPI<typeof mockData>('empty-trash');

      expect(result).toEqual(mockData);
    });

    it('should handle empty response', async () => {
      const mockResponse = {
        ok: true,
        text: jest.fn().mockResolvedValue('')
      };
      (ServerConnection.makeRequest as jest.Mock).mockResolvedValue(
        mockResponse
      );

      const result = await requestAPI('empty-trash');

      expect(result).toBe('');
    });

    it('should throw NetworkError on connection failure', async () => {
      const networkError = new Error('Connection refused');
      (ServerConnection.makeRequest as jest.Mock).mockRejectedValue(
        networkError
      );

      await expect(requestAPI('empty-trash')).rejects.toThrow();
      try {
        await requestAPI('empty-trash');
      } catch (error) {
        expect((error as Error).name).toBe('NetworkError');
      }
    });

    it('should throw ResponseError on non-ok response', async () => {
      const mockResponse = {
        ok: false,
        text: jest.fn().mockResolvedValue('{"message": "Not found"}')
      };
      (ServerConnection.makeRequest as jest.Mock).mockResolvedValue(
        mockResponse
      );

      await expect(requestAPI('empty-trash')).rejects.toThrow();
      try {
        await requestAPI('empty-trash');
      } catch (error) {
        expect((error as Error).name).toBe('ResponseError');
      }
    });

    it('should pass custom init options', async () => {
      const mockResponse = {
        ok: true,
        text: jest.fn().mockResolvedValue('{}')
      };
      (ServerConnection.makeRequest as jest.Mock).mockResolvedValue(
        mockResponse
      );

      const customInit = { method: 'POST', body: '{}' };
      await requestAPI('empty-trash', customInit);

      expect(ServerConnection.makeRequest).toHaveBeenCalledWith(
        expect.any(String),
        customInit,
        mockSettings
      );
    });

    it('should handle non-JSON response gracefully', async () => {
      const mockResponse = {
        ok: true,
        text: jest.fn().mockResolvedValue('plain text response')
      };
      (ServerConnection.makeRequest as jest.Mock).mockResolvedValue(
        mockResponse
      );

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const result = await requestAPI('empty-trash');

      expect(result).toBe('plain text response');
      expect(consoleSpy).toHaveBeenCalledWith(
        'Not a JSON response body.',
        mockResponse
      );
      consoleSpy.mockRestore();
    });
  });
});
