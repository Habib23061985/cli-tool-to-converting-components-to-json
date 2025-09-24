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
    
    mockedFs.pathExists.mockImplementation(() => Promise.resolve(true));
    mockedFs.readJson.mockImplementation(() => Promise.resolve({
      projectName: 'test-project',
      figmaToken: 'test-token',
      outputDirectory: './src',
      codeConnect: {
        include: ['**/*.tsx'],
        parser: 'typescript'
      }
    }));
    mockedFs.existsSync.mockImplementation(() => true);
    mockedFs.readdirSync.mockImplementation(() => ['Button.tsx', 'Icon.tsx'] as any);
    mockedFs.readFileSync.mockImplementation(() => `
      import React from 'react';
      interface ButtonProps {
        variant: 'primary' | 'secondary';
        onClick: () => void;
      }
      export const Button: React.FC<ButtonProps> = ({ variant, onClick }) => {
        return <button onClick={onClick}>Click me</button>;
      };
    `);
  });

  it('should generate documentation for components', async () => {
    await documentCommand({ output: 'output.json' });

    expect(mockedFs.pathExists).toHaveBeenCalled();
    expect(mockedFs.readJson).toHaveBeenCalled();
    expect(mockedFs.readdirSync).toHaveBeenCalled();
    expect(mockedFs.readFileSync).toHaveBeenCalled();
    expect(mockedFs.writeJSONSync).toHaveBeenCalled();
    expect(exitCode).toBeUndefined();
  });

  it('should handle missing config file', async () => {
    mockedFs.pathExists.mockImplementation(() => Promise.resolve(false));
    
    await expect(documentCommand({ output: 'output.json' }))
      .rejects.toThrow('Process.exit called');
    expect(exitCode).toBe(1);
  });

  it('should handle missing components directory', async () => {
    mockedFs.existsSync.mockImplementation(() => false);

    await expect(documentCommand({})).rejects.toThrow('Process.exit called');
    expect(exitCode).toBe(1);
  });

  it('should handle parse errors gracefully', async () => {
    mockedFs.readFileSync.mockImplementation(() => 'invalid typescript code');

    await documentCommand({ output: 'output.json' });

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Could not parse'));
    expect(exitCode).toBeUndefined();
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