import { requestAPI } from './handler';
import { showDialog, Dialog, Notification } from '@jupyterlab/apputils';
import { trashIcon } from './TrashIcon';
import { ITranslator } from '@jupyterlab/translation';
import { ITrashEmptyResponse } from './ITrashEmptyResponse';

export const emptyTrashCommand = (translator: ITranslator) => {
  const trans = translator.load('odh_jupyter_trash_cleanup');
  return {
    label: trans.__('Empty Trash'),
    caption: trans.__('Empty Trash'),
    icon: trashIcon,
    execute: async () => {
      const result = await showDialog({
        title: trans.__('Empty all items from Trash?'),
        body: trans.__('All items in the Trash will be permanently deleted.'),
        buttons: [
          Dialog.cancelButton({ label: trans.__('Cancel') }),
          Dialog.okButton({ label: trans.__('Empty Trash') })
        ]
      });
      if (!result.button.accept) {
        return;
      }
      Notification.promise(requestAPI<any>('empty-trash', { method: 'POST' }), {
        pending: {
          message: trans.__('Emptying Trash...'),
          options: { autoClose: false }
        },
        success: {
          message: result => {
            const trashEmptyResponse = result as ITrashEmptyResponse;
            console.log('' + trashEmptyResponse.deleted);

            if (trashEmptyResponse.deleted > 0) {
              return trans._n(
                '%1 file successfully removed from trash.',
                '%1 files successfully removed from trash.',
                trashEmptyResponse.deleted,
                [trashEmptyResponse.deleted]
              );
            } else {
              return trans.__('No files removed, trash was already empty.');
            }
          }
        },
        error: { message: () => trans.__('Error removing files from trash') }
      });
    }
  };
};
