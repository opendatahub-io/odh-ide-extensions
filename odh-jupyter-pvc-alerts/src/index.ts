import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { ITranslator } from '@jupyterlab/translation';

import { requestUsage } from './handler';
import { StorageMonitor } from './monitor';

const PLUGIN_ID = 'odh-jupyter-pvc-alerts:plugin';

const plugin: JupyterFrontEndPlugin<void> = {
  id: PLUGIN_ID,
  description: 'Help you free up notebook storage before it affects your work.',
  autoStart: true,
  requires: [ISettingRegistry, ITranslator],
  activate: async (
    app: JupyterFrontEnd,
    registry: ISettingRegistry,
    translator: ITranslator
  ) => {
    const settings = await registry.load(PLUGIN_ID);
    const trans = translator.load('odh_jupyter_pvc_alerts');
    const monitor = new StorageMonitor(requestUsage, trans);
    const configure = (): void => {
      monitor.configure({
        enabled: settings.get('enabled').composite as boolean,
        warningThreshold: settings.get('warningThreshold').composite as number,
        pollInterval: settings.get('pollInterval').composite as number
      });
    };
    // Do not await restoration during activation: restoration itself waits
    // for auto-start plugins to finish activating.
    void app.restored.then(() => {
      if (!monitor.isDisposed) {
        settings.changed.connect(configure);
        configure();
      }
    });
    const onPageHide = (event: PageTransitionEvent): void => {
      // A page kept in the back/forward cache may be resumed later.
      if (!event.persisted) {
        window.removeEventListener('pagehide', onPageHide);
        settings.changed.disconnect(configure);
        monitor.dispose();
      }
    };
    window.addEventListener('pagehide', onPageHide);
  }
};

export default plugin;
