/**
 * Unit tests for ITrashEmptyResponse interface
 */

import { ITrashEmptyResponse } from '../ITrashEmptyResponse';

describe('ITrashEmptyResponse', () => {
  it('should allow valid response with deleted files', () => {
    const response: ITrashEmptyResponse = {
      message: 'Trash emptied successfully',
      deleted: 5
    };

    expect(response.message).toBe('Trash emptied successfully');
    expect(response.deleted).toBe(5);
  });

  it('should allow response with zero deleted files', () => {
    const response: ITrashEmptyResponse = {
      message: 'Trash was already empty',
      deleted: 0
    };

    expect(response.deleted).toBe(0);
    expect(response.message).toContain('empty');
  });

  it('should have correct property types', () => {
    const response: ITrashEmptyResponse = {
      message: 'test',
      deleted: 10
    };

    expect(typeof response.message).toBe('string');
    expect(typeof response.deleted).toBe('number');
  });
});
