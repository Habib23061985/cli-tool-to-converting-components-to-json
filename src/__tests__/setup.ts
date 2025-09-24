import { cleanup } from '@testing-library/react';

beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  cleanup();
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