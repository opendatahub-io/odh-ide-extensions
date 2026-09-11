import { JupyterFrontEnd } from '@jupyterlab/application';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { ITranslator, nullTranslator } from '@jupyterlab/translation';

import schema from '../../schema/plugin.json';
import { requestUsage } from '../handler';
import plugin from '../index';
import { StorageMonitor } from '../monitor';

jest.mock('@jupyterlab/settingregistry', () => ({
  ISettingRegistry: {}
}));
jest.mock('../handler', () => ({ requestUsage: jest.fn() }));
jest.mock('../monitor', () => ({
  StorageMonitor: jest.fn(() => {
    const monitor = {
      isDisposed: false,
      configure: jest.fn(),
      dispose: jest.fn(() => {
        monitor.isDisposed = true;
      })
    };
    return monitor;
  })
}));

const defaults = {
  enabled: schema.properties.enabled.default,
  warningThreshold: schema.properties.warningThreshold.default,
  pollInterval: schema.properties.pollInterval.default
};

describe('plugin lifecycle', () => {
  let restore: () => void;
  let monitor: jest.Mocked<StorageMonitor>;
  let settings: {
    get: jest.Mock;
    changed: { connect: jest.Mock; disconnect: jest.Mock };
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const app = {
      restored: new Promise<void>(resolve => (restore = resolve))
    };
    settings = {
      get: jest.fn((key: keyof typeof defaults) => ({
        composite: defaults[key]
      })),
      changed: { connect: jest.fn(), disconnect: jest.fn() }
    };
    const registry = { load: jest.fn().mockResolvedValue(settings) };
    // Minimal doubles for the host application and settings service.
    const translator = {
      languageCode: 'en',
      load: jest.fn(() => nullTranslator.load('odh_jupyter_pvc_alerts'))
    };
    await plugin.activate(
      app as JupyterFrontEnd,
      registry as unknown as ISettingRegistry,
      translator
    );
    expect(plugin.requires).toContain(ITranslator);
    expect(translator.load).toHaveBeenCalledWith('odh_jupyter_pvc_alerts');
    expect(StorageMonitor).toHaveBeenCalledWith(
      requestUsage,
      translator.load.mock.results[0].value
    );
    expect(schema['jupyter.lab.internationalization'].domain).toBe(
      'odh_jupyter_pvc_alerts'
    );
    monitor = jest.mocked(StorageMonitor).mock.results[0].value;
    expect(registry.load).toHaveBeenCalledWith(plugin.id);
  });

  afterEach(() => {
    window.dispatchEvent(new Event('pagehide'));
  });

  it('finishes activation before restoration to avoid blocking startup', async () => {
    expect(monitor.configure).not.toHaveBeenCalled();
    restore();
    await Promise.resolve();
    expect(monitor.configure).toHaveBeenCalledWith({
      enabled: true,
      warningThreshold: 90,
      pollInterval: 60
    });
    expect(schema.properties.pollInterval.maximum).toBe(86400);

    const configure = settings.changed.connect.mock.calls[0][0];
    settings.get.mockImplementation((key: keyof typeof defaults) => ({
      composite: key === 'enabled' ? false : defaults[key]
    }));
    configure();
    expect(monitor.configure).toHaveBeenCalledTimes(2);
    expect(monitor.configure).toHaveBeenLastCalledWith(
      expect.objectContaining({ enabled: false })
    );
  });

  it('disconnects settings and removes the shutdown listener', async () => {
    restore();
    await Promise.resolve();
    window.dispatchEvent(new Event('pagehide'));
    window.dispatchEvent(new Event('pagehide'));
    expect(monitor.dispose).toHaveBeenCalledTimes(1);
    expect(settings.changed.disconnect).toHaveBeenCalledWith(
      settings.changed.connect.mock.calls[0][0]
    );
  });

  it('does not reconnect settings if the page closes before restoration', async () => {
    window.dispatchEvent(new Event('pagehide'));
    restore();
    await Promise.resolve();
    expect(monitor.dispose).toHaveBeenCalledTimes(1);
    expect(settings.changed.connect).not.toHaveBeenCalled();
    expect(monitor.configure).not.toHaveBeenCalled();
  });

  it('keeps monitoring when the page enters the back/forward cache', async () => {
    restore();
    await Promise.resolve();
    window.dispatchEvent(
      new PageTransitionEvent('pagehide', { persisted: true })
    );
    expect(monitor.dispose).not.toHaveBeenCalled();
    expect(settings.changed.disconnect).not.toHaveBeenCalled();
  });
});
