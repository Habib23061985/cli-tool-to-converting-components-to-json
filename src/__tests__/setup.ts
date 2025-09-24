import { cleanup } from '@testing-library/react';

// Extend Jest matchers
expect.extend({
  toContainObject(received: any[], argument: object) {
    const pass = received.some((obj) =>
      Object.keys(argument).every((key) => obj[key] === argument[key])
    );

    return {
      message: () =>
        `expected ${JSON.stringify(received)} to contain object ${JSON.stringify(
          argument
        )}`,
      pass,
    };
  },
});

// Global test setup
beforeAll(() => {
  // Add any global setup here
});

// Global test teardown
afterAll(() => {
  // Add any global teardown here
});

// Cleanup after each test
afterEach(() => {
  cleanup();
  jest.clearAllMocks();
});

// Mock console methods to keep test output clean
const originalConsole = { ...console };
beforeAll(() => {
  global.console = {
    ...console,
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  };
});

afterAll(() => {
  global.console = originalConsole;
});