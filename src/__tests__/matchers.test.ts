import '../test-utils/custom-matchers';

describe('Custom matchers', () => {
  describe('toContainObject', () => {
    it('should match object in array', () => {
      const arr = [
        { id: 1, name: 'test1' },
        { id: 2, name: 'test2' }
      ];
      
      expect(arr).toContainObject({ id: 1 });
      expect(arr).toContainObject({ name: 'test2' });
      expect(arr).not.toContainObject({ id: 3 });
    });

    it('should handle empty array', () => {
      const arr: any[] = [];
      expect(arr).not.toContainObject({ id: 1 });
    });

    it('should match exact object properties', () => {
      const arr = [{ id: 1, name: 'test' }];
      expect(arr).toContainObject({ id: 1, name: 'test' });
      expect(arr).not.toContainObject({ id: 1, name: 'wrong' });
    });
  });
});