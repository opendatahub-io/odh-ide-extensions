import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { ICommandPalette } from '@jupyterlab/apputils';
import { ITranslator } from '@jupyterlab/translation';
import { emptyTrashCommand } from './emptyTrashCommand';

const ODH_IDE_CLEAR_TRASH_COMMAND = 'odh-ide:clear-trash';
const ODH_IDE_CATEGORY = 'ODH IDE';
/**
 * Initialization data for the odh-jupyter-trash-cleanup extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'odh-jupyter-trash-cleanup:plugin',
  description:
    'A JupyterLab extension to allow users to clean the trash from the JupyterLab UI',
  autoStart: true,
  requires: [ICommandPalette, ITranslator],
  activate: (
    app: JupyterFrontEnd,
    commandPalette: ICommandPalette,
    translator: ITranslator
  ) => {
    console.log('JupyterLab extension odh-jupyter-trash-cleanup is activated!');
    const { commands } = app;

    commands.addCommand(
      ODH_IDE_CLEAR_TRASH_COMMAND,
      emptyTrashCommand(translator)
    );
    commandPalette.addItem({
      command: ODH_IDE_CLEAR_TRASH_COMMAND,
      category: ODH_IDE_CATEGORY,
      args: { origin: 'from palette' }
    });
  }
};

export default plugin;
