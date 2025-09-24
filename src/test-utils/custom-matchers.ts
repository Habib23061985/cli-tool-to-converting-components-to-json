interface CustomMatchers<R = unknown> {
  toContainObject(expected: Record<string, any>): R;
}

declare global {
  namespace jest {
    interface Expect extends CustomMatchers {}
    interface Matchers<R> extends CustomMatchers<R> {}
    interface InverseAsymmetricMatchers extends CustomMatchers {}
  }
}

export {};

const customMatchers = {
  toContainObject(received: any[], expected: Record<string, any>) {
    const pass = received.some((item) =>
      Object.keys(expected).every((key) => item[key] === expected[key])
    );

    return {
      pass,
      message: () =>
        `expected ${JSON.stringify(received)} ${pass ? 'not ' : ''}to contain object ${JSON.stringify(expected)}`,
    };
  },
};

expect.extend(customMatchers);