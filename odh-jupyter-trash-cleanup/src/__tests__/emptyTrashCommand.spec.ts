/**
 * Unit tests for emptyTrashCommand module
 */

jest.mock('@jupyterlab/apputils', () => ({
  showDialog: jest.fn(),
  Dialog: {
    cancelButton: jest.fn(() => ({ accept: false })),
    okButton: jest.fn(() => ({ accept: true }))
  },
  Notification: { promise: jest.fn() }
}));

jest.mock('../handler', () => ({
  requestAPI: jest.fn()
}));

jest.mock('../TrashIcon', () => ({
  trashIcon: { name: 'trash-icon' }
}));

import { showDialog, Notification } from '@jupyterlab/apputils';
import { requestAPI } from '../handler';
import { emptyTrashCommand } from '../emptyTrashCommand';

function createMockTranslator(loadMock?: jest.Mock) {
  const defaultLoad = () => ({
    __: (str: string) => str,
    _n: (singular: string, plural: string, n: number) =>
      n === 1 ? singular : plural
  });

  return {
    load: loadMock ?? jest.fn().mockImplementation(defaultLoad)
  };
}

describe('emptyTrashCommand module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('command structure', () => {
    it('should export emptyTrashCommand function', () => {
      expect(typeof emptyTrashCommand).toBe('function');
    });

    it('should return an object with required properties', () => {
      const mockTranslator = createMockTranslator();
      const command = emptyTrashCommand(mockTranslator as any);

      expect(command).toHaveProperty('label');
      expect(command).toHaveProperty('caption');
      expect(command).toHaveProperty('icon');
      expect(command).toHaveProperty('execute');
    });

    it('should have correct label text', () => {
      const mockTranslator = createMockTranslator();
      const command = emptyTrashCommand(mockTranslator as any);

      expect(command.label).toBe('Empty Trash');
      expect(command.caption).toBe('Empty Trash');
    });

    it('should have execute as async function', () => {
      const mockTranslator = createMockTranslator();
      const command = emptyTrashCommand(mockTranslator as any);

      expect(typeof command.execute).toBe('function');
    });
  });

  describe('translation integration', () => {
    it('should call translator.load with correct namespace', () => {
      const loadMock = jest.fn().mockReturnValue({
        __: (str: string) => str,
        _n: (singular: string, plural: string, n: number) =>
          n === 1 ? singular : plural
      });
      const mockTranslator = createMockTranslator(loadMock);

      emptyTrashCommand(mockTranslator as any);

      expect(loadMock).toHaveBeenCalledWith('odh_jupyter_trash_cleanup');
    });
  });

  describe('execute behavior', () => {
    it('should show confirmation dialog when executed', async () => {
      (showDialog as jest.Mock).mockResolvedValue({
        button: { accept: false }
      });
      const command = emptyTrashCommand(createMockTranslator() as any);

      await command.execute();

      expect(showDialog).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Empty all items from Trash?',
          body: 'All items in the Trash will be permanently deleted.'
        })
      );
    });

    it('should not empty trash when dialog is cancelled', async () => {
      (showDialog as jest.Mock).mockResolvedValue({
        button: { accept: false }
      });
      const command = emptyTrashCommand(createMockTranslator() as any);

      await command.execute();

      expect(requestAPI).not.toHaveBeenCalled();
      expect(Notification.promise).not.toHaveBeenCalled();
    });

    it('should send POST request when dialog is accepted', async () => {
      (showDialog as jest.Mock).mockResolvedValue({
        button: { accept: true }
      });
      const command = emptyTrashCommand(createMockTranslator() as any);

      await command.execute();

      expect(requestAPI).toHaveBeenCalledWith('empty-trash', { method: 'POST' });
      expect(Notification.promise).toHaveBeenCalled();
    });

    it('should wrap API call with Notification.promise', async () => {
      (showDialog as jest.Mock).mockResolvedValue({
        button: { accept: true }
      });
      const command = emptyTrashCommand(createMockTranslator() as any);

      await command.execute();

      const notificationCall = (Notification.promise as jest.Mock).mock
        .calls[0][1];
      expect(notificationCall.pending.message).toBe('Emptying Trash...');
      expect(notificationCall.error.message).toBeInstanceOf(Function);
      expect(notificationCall.success.message).toBeInstanceOf(Function);
    });
  });
});
