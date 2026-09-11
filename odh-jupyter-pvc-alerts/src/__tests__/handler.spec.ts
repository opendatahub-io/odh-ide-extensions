import { ServerConnection } from '@jupyterlab/services';

import { IStorageUsage, requestUsage } from '../handler';

const usage: IStorageUsage = {
  path: '/notebook',
  totalBytes: 1000,
  usedBytes: 900,
  availableBytes: 50,
  usagePercent: (900 / 950) * 100
};

describe('requestUsage', () => {
  let request: jest.SpyInstance;

  beforeEach(() => {
    const settings = ServerConnection.makeSettings({
      baseUrl: 'https://example.com/notebook/user/'
    });
    jest.spyOn(ServerConnection, 'makeSettings').mockReturnValue(settings);
    request = jest.spyOn(ServerConnection, 'makeRequest');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('uses the server base URL and disables caching', async () => {
    request.mockResolvedValue(new Response(JSON.stringify(usage)));
    await expect(requestUsage()).resolves.toEqual(usage);
    expect(request).toHaveBeenCalledWith(
      'https://example.com/notebook/user/odh-jupyter-pvc-alerts/usage',
      { method: 'GET', cache: 'no-store' },
      ServerConnection.makeSettings()
    );
  });

  it.each([0, 100])('accepts %s%% usage', async usagePercent => {
    const payload = {
      ...usage,
      usagePercent,
      usedBytes: usagePercent * 10,
      availableBytes: (100 - usagePercent) * 10
    };
    request.mockResolvedValue(new Response(JSON.stringify(payload)));
    await expect(requestUsage()).resolves.toEqual(payload);
  });

  it('propagates HTTP errors with the server message', async () => {
    request.mockResolvedValue(
      new Response(JSON.stringify({ message: 'Storage unavailable' }), {
        status: 503
      })
    );
    await expect(requestUsage()).rejects.toMatchObject({
      message: 'Storage unavailable',
      response: { status: 503 }
    });
  });

  it('propagates network errors', async () => {
    const error = new Error('Network unavailable');
    request.mockRejectedValue(error);
    await expect(requestUsage()).rejects.toBe(error);
  });

  it('rejects invalid JSON', async () => {
    request.mockResolvedValue(new Response('<html>Proxy error</html>'));
    await expect(requestUsage()).rejects.toThrow();
  });

  it.each([
    null,
    [],
    'invalid',
    {},
    { ...usage, path: '' },
    { ...usage, totalBytes: 0 },
    { ...usage, totalBytes: -1 },
    { ...usage, usedBytes: '900' },
    { ...usage, availableBytes: -1 },
    { ...usage, usagePercent: null },
    { ...usage, usagePercent: -1 },
    { ...usage, usagePercent: 101 }
  ])('rejects malformed usage: %j', async payload => {
    request.mockResolvedValue(new Response(JSON.stringify(payload)));
    await expect(requestUsage()).rejects.toThrow(
      'Invalid storage usage response'
    );
  });

  it('rejects numbers that overflow to infinity when parsed', async () => {
    request.mockResolvedValue(
      new Response(JSON.stringify(usage).replace('1000', '1e400'))
    );
    await expect(requestUsage()).rejects.toThrow(
      'Invalid storage usage response'
    );
  });
});
