/**
 * Unit tests for TrashIcon module
 */

jest.mock('@jupyterlab/ui-components', () => ({
  LabIcon: jest.fn().mockImplementation((options: { name: string }) => ({
    name: options.name,
    svgstr: '<svg></svg>'
  }))
}));

jest.mock('../../style/icons/trash.svg', () => '<svg></svg>', {
  virtual: true
});

import { trashIcon } from '../TrashIcon';

describe('TrashIcon module', () => {
  it('should export trashIcon', () => {
    expect(trashIcon).toBeDefined();
  });

  it('should have name property', () => {
    expect(trashIcon).toHaveProperty('name');
  });

  it('should have correct icon name', () => {
    expect(trashIcon.name).toContain('trash');
  });
});
