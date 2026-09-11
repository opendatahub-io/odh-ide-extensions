import { URLExt } from '@jupyterlab/coreutils';
import { ServerConnection } from '@jupyterlab/services';

export interface IStorageUsage {
  path: string;
  totalBytes: number;
  usedBytes: number;
  availableBytes: number;
  usagePercent: number;
}

export async function requestUsage(): Promise<IStorageUsage> {
  const settings = ServerConnection.makeSettings();
  const url = URLExt.join(settings.baseUrl, 'odh-jupyter-pvc-alerts', 'usage');
  const response = await ServerConnection.makeRequest(
    url,
    { method: 'GET', cache: 'no-store' },
    settings
  );
  if (!response.ok) {
    throw await ServerConnection.ResponseError.create(response);
  }
  const usage: unknown = await response.json();
  if (!isStorageUsage(usage)) {
    throw new Error('Invalid storage usage response');
  }
  return usage;
}

/** Reject malformed data rather than showing a misleading storage warning. */
function isStorageUsage(value: unknown): value is IStorageUsage {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const usage = value as Partial<IStorageUsage>;
  const isNonNegative = (amount: unknown): amount is number =>
    typeof amount === 'number' && Number.isFinite(amount) && amount >= 0;

  return (
    typeof usage.path === 'string' &&
    usage.path.length > 0 &&
    isNonNegative(usage.totalBytes) &&
    usage.totalBytes > 0 &&
    isNonNegative(usage.usedBytes) &&
    isNonNegative(usage.availableBytes) &&
    isNonNegative(usage.usagePercent) &&
    usage.usagePercent <= 100
  );
}
