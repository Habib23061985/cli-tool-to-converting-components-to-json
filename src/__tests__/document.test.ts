import { documentCommand } from '../commands/document';
import fs from 'fs-extra';
import path from 'path';
import { loadConfig } from '../utils/config';
import '../test-utils/custom-matchers';

// Mock process.exit and console.error
let exitCode: number | null | undefined;
const exitMock = jest.spyOn(process, 'exit').mockImplementation((code?: string | number | null) => {
  exitCode = typeof code === 'number' ? code : 1;
  return undefined as never;
});

const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

// Mock fs-extra
// Mock fs-extra and path
jest.mock('fs-extra', () => ({
  pathExists: jest.fn(() => Promise.resolve(true)),
  readJson: jest.fn(() => Promise.resolve({})),
  existsSync: jest.fn(() => true),
  readdirSync: jest.fn(() => []),
  readFileSync: jest.fn(() => ''),
  writeJSONSync: jest.fn()
}));

const mockedFs = fs as jest.Mocked<typeof fs>;

// Mock path
jest.mock('path', () => ({
  ...jest.requireActual('path'),
  resolve: jest.fn(),
}));
const mockedPath = path as jest.Mocked<typeof path>;

describe('documentCommand', () => {
beforeEach(() => {
  jest.clearAllMocks();
  exitCode = undefined;
  
  // Setup default mock implementations
  mockedFs.pathExists.mockImplementation(() => Promise.resolve(true));
  mockedFs.readJson.mockImplementation(() => Promise.resolve({
    projectName: 'test-project',
    figmaToken: 'test-token',
    outputDirectory: './src',
    componentsDir: './src/components',
    codeConnect: {
      include: ['**/*.tsx'],
      parser: 'typescript'
    }
  }));
  mockedFs.existsSync.mockImplementation(() => true);
  mockedFs.readdirSync.mockReturnValue(['Button.tsx', 'Icon.tsx'] as any);
  mockedFs.readFileSync.mockImplementation(() => `
    import React from 'react';
    interface ButtonProps {
      variant: 'primary' | 'secondary';
      onClick: () => void;
    }
    /** 
     * A customizable button component
     * @component 
     */
    export const Button: React.FC<ButtonProps> = ({ variant, onClick }) => {
      return <button onClick={onClick}>Click me</button>;
    };
  `);
  
  // Mock path.resolve to return predictable paths
  mockedPath.resolve.mockImplementation((...args: string[]) => args.join('/'));
});  it('should generate documentation for components', async () => {
    await documentCommand({ output: 'output.json' });

    // Verify config was loaded
    expect(mockedFs.pathExists).toHaveBeenCalled();
    expect(mockedFs.readJson).toHaveBeenCalled();

    // Verify components were processed
    expect(mockedFs.readdirSync).toHaveBeenCalled();
    expect(mockedFs.readFileSync).toHaveBeenCalled();

    // Verify output was written
    expect(mockedFs.writeJSONSync).toHaveBeenCalled();
    const writeCall = mockedFs.writeJSONSync.mock.calls[0];
    expect(writeCall[0]).toContain('output.json');
    expect(writeCall[1]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'Button',
          props: expect.arrayContaining([
            expect.objectContaining({
              name: 'variant',
              type: 'enum',
              values: ['primary', 'secondary']
            })
          ])
        })
      ])
    );
  });

  it('should handle missing config file', async () => {
    mockedFs.pathExists.mockImplementation(() => Promise.resolve(false));
    await documentCommand({ output: 'output.json' });
    expect(exitCode).toBe(1);
    expect(console.error).toHaveBeenCalledWith(
      expect.stringMatching(/Configuration file not found/)
    );
  });

  it('should handle missing components directory', async () => {
    mockedFs.existsSync.mockReturnValue(false);
    await documentCommand({});
    expect(exitCode).toBe(1);
    expect(console.error).toHaveBeenCalledWith(
      expect.stringMatching(/Components directory not found/)
    );
  });

  it('should handle parse errors gracefully', async () => {
    mockedFs.readFileSync.mockReturnValue('invalid typescript code');
    await documentCommand({ output: 'output.json' });
    expect(console.warn).toHaveBeenCalledWith(expect.stringMatching(/Could not fully parse/));
  });

  it('should filter out test and type definition files', async () => {
    mockedFs.readdirSync.mockImplementation(() => [
      'Button.tsx',
      'Button.test.tsx',
      'Button.spec.tsx',
      'Button.d.ts',
      'Icon.tsx',
    ] as any);

    await documentCommand({ output: 'output.json' });

    const readCalls = mockedFs.readFileSync.mock.calls;
    const processedFiles = readCalls.map(call => path.basename(call[0].toString()));
    expect(processedFiles).toContain('Button.tsx');
    expect(processedFiles).toContain('Icon.tsx');
    expect(processedFiles).not.toContain('Button.test.tsx');
    expect(processedFiles).not.toContain('Button.d.ts');
  });
});