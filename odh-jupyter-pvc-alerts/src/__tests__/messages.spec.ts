import { Dialog, showDialog } from '@jupyterlab/apputils';
import { Gettext } from '@jupyterlab/translation';

import { IStorageUsage } from '../handler';
import { showStorageHelp, storageWarning } from '../messages';

jest.mock('@jupyterlab/apputils', () => ({
  Dialog: { okButton: jest.fn(options => options) },
  showDialog: jest.fn().mockResolvedValue(undefined)
}));

const usage: IStorageUsage = {
  path: '/notebook',
  totalBytes: 100 * 1024 ** 3,
  usedBytes: 95 * 1024 ** 3,
  availableBytes: 5 * 1024 ** 3,
  usagePercent: 95
};

function frenchBundle(): Gettext {
  const domain = 'odh_jupyter_pvc_alerts';
  const trans = new Gettext({ domain, locale: 'fr' });
  trans.loadJSON(
    {
      '': {
        domain,
        language: 'fr',
        pluralForms: 'nplurals=2; plural=(n > 1);'
      },
      'Notebook storage: %1% used (%2 available). Free up space to avoid problems saving your work.':
        ['Stockage : %2 disponibles, %1% utilisés. Libérez de l’espace.'],
      '%2 byte': ['%2 octet', '%2 octets'],
      'How to free up notebook storage': ['Comment libérer du stockage'],
      'Use the file browser to remove files you no longer need, then empty the Trash to release the space. Keep a copy of anything important before emptying the Trash; this cannot be undone. If you need to keep your files, ask your administrator whether more storage is available. Storage location: %1. The alert measures the storage containing this location, not just the files in that folder.':
        [
          'Emplacement : %1. Supprimez les fichiers inutiles puis videz la corbeille. Cette opération est irréversible.'
        ],
      Close: ['Fermer']
    },
    domain
  );
  return trans;
}

it.each([
  [0, '0 octet'],
  [1, '1 octet'],
  [2, '2 octets']
])(
  'uses translated plural rules and reordered placeholders for %s bytes',
  (availableBytes, expected) => {
    expect(storageWarning({ ...usage, availableBytes }, frenchBundle())).toBe(
      `Stockage : ${expected} disponibles, 95% utilisés. Libérez de l’espace.`
    );
  }
);

it('falls back to the source text for missing unit translations', () => {
  expect(storageWarning(usage, frenchBundle())).toContain('5 GiB disponibles');
});

it('translates the help dialog and interpolates the storage path', async () => {
  await showStorageHelp('/notebook/<example>', frenchBundle());
  expect(showDialog).toHaveBeenLastCalledWith({
    title: 'Comment libérer du stockage',
    body: 'Emplacement : /notebook/<example>. Supprimez les fichiers inutiles puis videz la corbeille. Cette opération est irréversible.',
    buttons: [{ label: 'Fermer' }]
  });
});

it('keeps the warning and next step within the toast text limit', () => {
  const message = storageWarning({ ...usage, path: '/long-path'.repeat(50) });
  expect(message).toBe(
    'Notebook storage: 95% used (5 GiB available). ' +
      'Free up space to avoid problems saving your work.'
  );
  expect(message.length).toBeLessThanOrEqual(140);
  expect(message).not.toContain('/long-path');
});

it.each([
  [0, '0 bytes'],
  [1, '1 byte'],
  [512, '512 bytes'],
  [1024, '1 KiB'],
  [512 * 1024, '512 KiB'],
  [1.5 * 1024 ** 2, '1.5 MiB'],
  [5 * 1024 ** 3, '5 GiB'],
  [1024 ** 4, '1 TiB'],
  [1024 ** 5, '1 PiB']
])('displays %s available bytes as %s', (availableBytes, expected) => {
  expect(storageWarning({ ...usage, availableBytes })).toContain(
    `(${expected} available)`
  );
});

it('shows useful percentage precision without unnecessary trailing zeros', () => {
  expect(storageWarning({ ...usage, usagePercent: 95.14 })).toContain(
    '95.1% used'
  );
  expect(storageWarning({ ...usage, usagePercent: 100 })).toContain(
    '100% used'
  );
});

it('does not call storage nearly full when a user chooses an early warning', () => {
  expect(storageWarning({ ...usage, usagePercent: 50 })).toContain('50% used');
  expect(storageWarning({ ...usage, usagePercent: 50 })).not.toContain('full');
});

it('explains cleanup, data safety, and the storage location in the help dialog', async () => {
  await showStorageHelp('/notebook');
  expect(showDialog).toHaveBeenCalledWith({
    title: 'How to free up notebook storage',
    body: expect.stringContaining('Storage location: /notebook'),
    buttons: [{ label: 'Close' }]
  });
  const calls = jest.mocked(showDialog).mock.calls;
  const body = calls[calls.length - 1][0]!.body;
  expect(body).toContain('this cannot be undone');
  expect(body).toContain('ask your administrator');
  expect(body).toContain('not just the files in that folder');
  expect(Dialog.okButton).toHaveBeenCalledWith({ label: 'Close' });
});
