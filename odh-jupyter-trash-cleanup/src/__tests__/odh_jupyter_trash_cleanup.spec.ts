/**
 * Unit tests for odh-jupyter-trash-cleanup extension
 */

const mockICommandPalette = Symbol('ICommandPalette');
const mockITranslator = Symbol('ITranslator');

jest.mock('@jupyterlab/application', () => ({
  JupyterFrontEnd: jest.fn(),
  JupyterFrontEndPlugin: jest.fn()
}));

jest.mock('@jupyterlab/apputils', () => ({
  ICommandPalette: mockICommandPalette,
  showDialog: jest.fn(),
  Dialog: { okButton: jest.fn() },
  Notification: { emit: jest.fn() }
}));

jest.mock('@jupyterlab/translation', () => ({
  ITranslator: mockITranslator
}));

jest.mock('../handler', () => ({
  requestAPI: jest.fn()
}));

jest.mock('../TrashIcon', () => ({
  trashIcon: { name: 'trash-icon' }
}));

import plugin from '../index';

describe('odh-jupyter-trash-cleanup plugin', () => {
  it('should have correct plugin id', () => {
    expect(plugin.id).toBe('odh-jupyter-trash-cleanup:plugin');
  });

  it('should have autoStart enabled', () => {
    expect(plugin.autoStart).toBe(true);
  });

  it('should require ICommandPalette and ITranslator', () => {
    expect(plugin.requires).toBeDefined();
    expect(plugin.requires!.length).toBeGreaterThanOrEqual(2);
  });

  it('should have a description', () => {
    expect(plugin.description).toBeDefined();
    expect(plugin.description).toContain('trash');
  });

  it('should have an activate function', () => {
    expect(typeof plugin.activate).toBe('function');
  });
});
