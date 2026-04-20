/**
 * Unit tests for the handler module
 */

import { URLExt } from '@jupyterlab/coreutils';

describe('handler module', () => {
  describe('URLExt usage', () => {
    it('should correctly join URL paths', () => {
      const baseUrl = 'http://localhost:8888/';
      const namespace = 'odh-jupyter-trash-cleanup';
      const endpoint = 'empty-trash';

      const result = URLExt.join(baseUrl, namespace, endpoint);

      expect(result).toContain(namespace);
      expect(result).toContain(endpoint);
    });

    it('should handle empty endpoint', () => {
      const baseUrl = 'http://localhost:8888/';
      const namespace = 'odh-jupyter-trash-cleanup';

      const result = URLExt.join(baseUrl, namespace, '');

      expect(result).toContain(namespace);
    });
  });
});
