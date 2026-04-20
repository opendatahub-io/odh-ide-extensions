/**
 * Unit tests for emptyTrashCommand module
 */

jest.mock('@jupyterlab/apputils', () => ({
  showDialog: jest.fn(),
  Dialog: { okButton: jest.fn() },
  Notification: { emit: jest.fn() }
}));

jest.mock('../handler', () => ({
  requestAPI: jest.fn()
}));

jest.mock('../TrashIcon', () => ({
  trashIcon: { name: 'trash-icon' }
}));

import { emptyTrashCommand } from '../emptyTrashCommand';

describe('emptyTrashCommand module', () => {
  describe('command structure', () => {
    it('should export emptyTrashCommand function', () => {
      expect(typeof emptyTrashCommand).toBe('function');
    });

    it('should return an object with required properties', () => {
      const mockTranslator = {
        load: () => ({
          __: (str: string) => str,
          _n: (singular: string, plural: string, n: number) =>
            n === 1 ? singular : plural
        })
      };

      const command = emptyTrashCommand(mockTranslator as any);

      expect(command).toHaveProperty('label');
      expect(command).toHaveProperty('caption');
      expect(command).toHaveProperty('icon');
      expect(command).toHaveProperty('execute');
    });

    it('should have correct label text', () => {
      const mockTranslator = {
        load: () => ({
          __: (str: string) => str,
          _n: (singular: string, plural: string, n: number) =>
            n === 1 ? singular : plural
        })
      };

      const command = emptyTrashCommand(mockTranslator as any);

      expect(command.label).toBe('Empty Trash');
      expect(command.caption).toBe('Empty Trash');
    });

    it('should have execute as async function', () => {
      const mockTranslator = {
        load: () => ({
          __: (str: string) => str,
          _n: (singular: string, plural: string, n: number) =>
            n === 1 ? singular : plural
        })
      };

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

      const mockTranslator = { load: loadMock };

      emptyTrashCommand(mockTranslator as any);

      expect(loadMock).toHaveBeenCalledWith('odh_jupyter_trash_cleanup');
    });
  });
});
