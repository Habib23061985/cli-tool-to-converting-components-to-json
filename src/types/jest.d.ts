import 'jest';

declare global {
  namespace jest {
    interface Matchers<R> {
      toContainObject(expected: Record<string, any>): R;
    }
  }
}