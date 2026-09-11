import { Notification } from '@jupyterlab/apputils';
import { nullTranslator, TranslationBundle } from '@jupyterlab/translation';

import { IStorageUsage } from './handler';
import { showStorageHelp, storageWarning } from './messages';

export interface IMonitorSettings {
  enabled: boolean;
  warningThreshold: number;
  pollInterval: number;
}

/** Poll serially, keeping at most one warning per high-usage episode. */
export class StorageMonitor {
  constructor(
    private readonly fetchUsage: () => Promise<IStorageUsage>,
    private readonly trans: TranslationBundle = nullTranslator.load(
      'odh_jupyter_pvc_alerts'
    )
  ) {}

  get isDisposed(): boolean {
    return this.disposed;
  }

  configure(settings: IMonitorSettings): void {
    if (this.disposed) {
      return;
    }
    this.settings = { ...settings };
    this.generation++;
    this.clearTimer();
    this.clearWarning();
    if (settings.enabled && !this.running) {
      void this.poll();
    }
  }

  dispose(): void {
    this.disposed = true;
    this.generation++;
    this.clearTimer();
    this.clearWarning();
  }

  private async poll(): Promise<void> {
    this.running = true;
    const generation = this.generation;
    try {
      const usage = await this.fetchUsage();
      if (this.disposed || generation !== this.generation) {
        return;
      }
      this.failed = false;
      this.updateWarning(usage);
    } catch (error) {
      if (!this.disposed && generation === this.generation && !this.failed) {
        console.warn('PVC storage monitoring failed; will retry.', error);
        this.failed = true;
      }
    } finally {
      this.running = false;
      if (!this.disposed && this.settings.enabled) {
        // Recheck immediately if settings changed during the request.
        const delay =
          generation === this.generation
            ? this.settings.pollInterval * 1000
            : 0;
        this.timer = setTimeout(() => void this.poll(), delay);
      }
    }
  }

  private updateWarning(usage: IStorageUsage): void {
    if (usage.usagePercent < this.settings.warningThreshold) {
      this.clearWarning();
      return;
    }
    this.storagePath = usage.path;
    const message = storageWarning(usage, this.trans);
    if (this.warningId === null) {
      this.warningId = Notification.warning(message, {
        autoClose: false,
        actions: [
          {
            label: this.trans.__('How to free up space'),
            caption: this.trans.__(
              'View the storage location and cleanup tips'
            ),
            callback: event => {
              // Reading the advice should not dismiss the storage warning.
              event.preventDefault();
              void showStorageHelp(this.storagePath, this.trans).catch(
                error => {
                  console.warn('Unable to open storage help.', error);
                }
              );
            }
          }
        ]
      });
    } else if (message !== this.lastMessage) {
      // A dismissed notification cannot be updated. Wait for recovery to rearm.
      Notification.update({ id: this.warningId, message });
    }
    this.lastMessage = message;
  }

  private clearTimer(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private clearWarning(): void {
    if (this.warningId !== null) {
      Notification.dismiss(this.warningId);
      this.warningId = null;
    }
    this.lastMessage = '';
  }

  private settings: IMonitorSettings = {
    enabled: true,
    warningThreshold: 90,
    pollInterval: 60
  };
  private timer: ReturnType<typeof setTimeout> | null = null;
  private warningId: string | null = null;
  private lastMessage = '';
  private storagePath = '';
  private generation = 0;
  private running = false;
  private disposed = false;
  private failed = false;
}
