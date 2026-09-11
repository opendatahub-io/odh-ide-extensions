import { Dialog, showDialog } from '@jupyterlab/apputils';
import { nullTranslator, TranslationBundle } from '@jupyterlab/translation';

import { IStorageUsage } from './handler';

/** Keep the toast short; cleanup advice and the path belong in the help dialog. */
export function storageWarning(
  usage: IStorageUsage,
  trans: TranslationBundle = nullTranslator.load('odh_jupyter_pvc_alerts')
): string {
  const percent = usage.usagePercent.toLocaleString(undefined, {
    maximumFractionDigits: 1
  });
  return trans.__(
    'Notebook storage: %1% used (%2 available). Free up space to avoid problems saving your work.',
    percent,
    formatBytes(usage.availableBytes, trans)
  );
}

export async function showStorageHelp(
  path: string,
  trans: TranslationBundle = nullTranslator.load('odh_jupyter_pvc_alerts')
): Promise<void> {
  await showDialog({
    title: trans.__('How to free up notebook storage'),
    body: trans.__(
      'Use the file browser to remove files you no longer need, then empty the Trash to release the space. Keep a copy of anything important before emptying the Trash; this cannot be undone. If you need to keep your files, ask your administrator whether more storage is available. Storage location: %1. The alert measures the storage containing this location, not just the files in that folder.',
      path
    ),
    buttons: [Dialog.okButton({ label: trans.__('Close') })]
  });
}

function formatBytes(bytes: number, trans: TranslationBundle): string {
  const units = ['bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB'];
  let size = bytes;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit++;
  }
  const amount = size.toLocaleString(undefined, { maximumFractionDigits: 1 });
  // _n supplies the raw count as %1; %2 keeps the locale-formatted number.
  return unit === 0
    ? trans._n('%2 byte', '%2 bytes', bytes, amount)
    : trans.__('%1 %2', amount, units[unit]);
}
