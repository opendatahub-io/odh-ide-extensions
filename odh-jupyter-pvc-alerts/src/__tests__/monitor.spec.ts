import { Notification } from '@jupyterlab/apputils';
import { Gettext, nullTranslator } from '@jupyterlab/translation';

import { IStorageUsage } from '../handler';
import { showStorageHelp } from '../messages';
import { IMonitorSettings, StorageMonitor } from '../monitor';

jest.mock('@jupyterlab/apputils', () => ({
  Notification: {
    warning: jest.fn(() => 'warning-id'),
    update: jest.fn(),
    dismiss: jest.fn()
  }
}));

jest.mock('../messages', () => ({
  ...jest.requireActual('../messages'),
  showStorageHelp: jest.fn().mockResolvedValue(undefined)
}));

const defaults: IMonitorSettings = {
  enabled: true,
  warningThreshold: 90,
  pollInterval: 60
};
const usage = (percent: number): IStorageUsage => ({
  path: '/notebook',
  totalBytes: 1000,
  usedBytes: percent * 10,
  availableBytes: (100 - percent) * 10,
  usagePercent: percent
});

// Flush promise continuations without running the scheduled timer.
const flush = async (): Promise<void> => {
  await Promise.resolve();
  await Promise.resolve();
};

describe('StorageMonitor', () => {
  let monitor: StorageMonitor;
  let fetchUsage: jest.Mock<Promise<IStorageUsage>, []>;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    fetchUsage = jest.fn().mockResolvedValue(usage(90));
    monitor = new StorageMonitor(fetchUsage);
  });

  afterEach(() => {
    monitor.dispose();
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('warns at the threshold and does not duplicate unchanged warnings', async () => {
    monitor.configure(defaults);
    await flush();
    expect(Notification.warning).toHaveBeenCalledWith(
      expect.stringContaining('90% used'),
      expect.objectContaining({ autoClose: false })
    );
    jest.advanceTimersByTime(60000);
    await flush();
    expect(fetchUsage).toHaveBeenCalledTimes(2);
    expect(Notification.warning).toHaveBeenCalledTimes(1);
    expect(Notification.update).not.toHaveBeenCalled();
  });

  it('updates the warning and respects dismissal until recovery', async () => {
    monitor.configure(defaults);
    await flush();
    fetchUsage.mockResolvedValue(usage(95));
    jest.advanceTimersByTime(60000);
    await flush();
    expect(Notification.update).toHaveBeenCalledWith({
      id: 'warning-id',
      message: expect.stringContaining('95% used')
    });
    expect(Notification.warning).toHaveBeenCalledTimes(1);
    fetchUsage.mockResolvedValue(usage(89));
    jest.advanceTimersByTime(60000);
    await flush();
    expect(Notification.dismiss).toHaveBeenCalledWith('warning-id');
    fetchUsage.mockResolvedValue(usage(91));
    jest.advanceTimersByTime(60000);
    await flush();
    expect(Notification.warning).toHaveBeenCalledTimes(2);
  });

  it('opens cleanup advice without dismissing the warning', async () => {
    monitor.configure(defaults);
    await flush();
    const options = jest.mocked(Notification.warning).mock.calls[0][1];
    const action = options!.actions![0];
    expect(action.label).toBe('How to free up space');

    // The action should use the latest location, even if usage is unchanged.
    fetchUsage.mockResolvedValue({ ...usage(90), path: '/new-location' });
    jest.advanceTimersByTime(60000);
    await flush();
    const event = new MouseEvent('click', { cancelable: true });
    action.callback(event);
    expect(event.defaultPrevented).toBe(true);
    expect(showStorageHelp).toHaveBeenCalledWith(
      '/new-location',
      nullTranslator.load('odh_jupyter_pvc_alerts')
    );
    expect(Notification.dismiss).not.toHaveBeenCalled();
    expect(Notification.warning).toHaveBeenCalledTimes(1);
  });

  it('uses the injected translation bundle for warnings, actions, and help', async () => {
    const trans = new Gettext({ stringsPrefix: '[translated] ' });
    monitor.dispose();
    monitor = new StorageMonitor(fetchUsage, trans);
    monitor.configure(defaults);
    await flush();

    const [message, options] = jest.mocked(Notification.warning).mock.calls[0];
    expect(message).toMatch(/^\[translated\] Notebook storage:/);
    const action = options!.actions![0];
    expect(action.label).toBe('[translated] How to free up space');
    expect(action.caption).toBe(
      '[translated] View the storage location and cleanup tips'
    );
    action.callback(new MouseEvent('click', { cancelable: true }));
    expect(showStorageHelp).toHaveBeenCalledWith('/notebook', trans);
  });

  it('handles errors opening cleanup advice without dismissing the warning', async () => {
    const error = new Error('Dialog unavailable');
    jest.mocked(showStorageHelp).mockRejectedValueOnce(error);
    monitor.configure(defaults);
    await flush();
    const options = jest.mocked(Notification.warning).mock.calls[0][1];
    options!.actions![0].callback(new MouseEvent('click'));
    await flush();
    expect(console.warn).toHaveBeenCalledWith(
      'Unable to open storage help.',
      error
    );
    expect(Notification.dismiss).not.toHaveBeenCalled();
  });

  it('does not warn below the threshold', async () => {
    fetchUsage.mockResolvedValue(usage(89.99));
    monitor.configure(defaults);
    await flush();
    expect(Notification.warning).not.toHaveBeenCalled();
  });

  it('does not poll when disabled and clears an existing warning', async () => {
    monitor.configure({ ...defaults, enabled: false });
    expect(fetchUsage).not.toHaveBeenCalled();
    monitor.configure(defaults);
    await flush();
    monitor.configure({ ...defaults, enabled: false });
    jest.advanceTimersByTime(120000);
    expect(fetchUsage).toHaveBeenCalledTimes(1);
    expect(Notification.dismiss).toHaveBeenCalledWith('warning-id');
  });

  it('applies changed thresholds and polling intervals immediately', async () => {
    monitor.configure({ ...defaults, warningThreshold: 95, pollInterval: 10 });
    await flush();
    expect(Notification.warning).not.toHaveBeenCalled();
    jest.advanceTimersByTime(10000);
    await flush();
    expect(fetchUsage).toHaveBeenCalledTimes(2);
    monitor.configure({ ...defaults, warningThreshold: 80 });
    await flush();
    expect(Notification.warning).toHaveBeenCalledTimes(1);
  });

  it('logs once per failure episode and retries without a false warning', async () => {
    fetchUsage.mockRejectedValue(new Error('Unavailable'));
    monitor.configure(defaults);
    await flush();
    jest.advanceTimersByTime(60000);
    await flush();
    expect(console.warn).toHaveBeenCalledTimes(1);
    expect(Notification.warning).not.toHaveBeenCalled();

    fetchUsage.mockResolvedValue(usage(95));
    jest.advanceTimersByTime(60000);
    await flush();
    expect(Notification.warning).toHaveBeenCalledTimes(1);

    fetchUsage.mockRejectedValue(new Error('Unavailable again'));
    jest.advanceTimersByTime(60000);
    await flush();
    expect(console.warn).toHaveBeenCalledTimes(2);
    expect(Notification.dismiss).not.toHaveBeenCalled();
  });

  it('does not overlap requests and ignores results after disabling', async () => {
    let resolve!: (value: IStorageUsage) => void;
    fetchUsage.mockReturnValue(new Promise(done => (resolve = done)));
    monitor.configure(defaults);
    jest.advanceTimersByTime(120000);
    monitor.configure({ ...defaults, warningThreshold: 80 });
    expect(fetchUsage).toHaveBeenCalledTimes(1);
    monitor.configure({ ...defaults, enabled: false });
    resolve(usage(95));
    await flush();
    expect(Notification.warning).not.toHaveBeenCalled();
    expect(jest.getTimerCount()).toBe(0);
  });

  it('rechecks with the latest settings after an in-flight request finishes', async () => {
    let resolve!: (value: IStorageUsage) => void;
    fetchUsage.mockReturnValueOnce(new Promise(done => (resolve = done)));
    monitor.configure(defaults);
    monitor.configure({ ...defaults, warningThreshold: 95, pollInterval: 10 });
    resolve(usage(99));
    await flush();
    expect(Notification.warning).not.toHaveBeenCalled();

    jest.advanceTimersByTime(0);
    await flush();
    expect(fetchUsage).toHaveBeenCalledTimes(2);
    expect(Notification.warning).not.toHaveBeenCalled();
    jest.advanceTimersByTime(10000);
    await flush();
    expect(fetchUsage).toHaveBeenCalledTimes(3);
  });

  it('ignores errors from requests started before disabling', async () => {
    fetchUsage.mockRejectedValue(new Error('Unavailable'));
    monitor.configure(defaults);
    monitor.configure({ ...defaults, enabled: false });
    await flush();
    expect(console.warn).not.toHaveBeenCalled();
    expect(jest.getTimerCount()).toBe(0);
  });

  it('keeps a settings snapshot until explicitly reconfigured', async () => {
    const settings = { ...defaults };
    monitor.configure(settings);
    settings.enabled = false;
    settings.warningThreshold = 100;
    await flush();
    expect(Notification.warning).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(60000);
    await flush();
    expect(fetchUsage).toHaveBeenCalledTimes(2);
  });

  it('cannot be restarted after disposal', () => {
    expect(monitor.isDisposed).toBe(false);
    monitor.dispose();
    monitor.dispose();
    monitor.configure(defaults);
    expect(monitor.isDisposed).toBe(true);
    expect(fetchUsage).not.toHaveBeenCalled();
    expect(jest.getTimerCount()).toBe(0);
  });

  it('disposes pending work without showing a warning or scheduling a timer', async () => {
    monitor.configure(defaults);
    monitor.dispose();
    await flush();
    expect(Notification.warning).not.toHaveBeenCalled();
    expect(jest.getTimerCount()).toBe(0);
  });
});
