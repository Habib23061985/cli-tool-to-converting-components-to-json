import { documentCommand } from '../commands/document';
import fs from 'fs-extra';
import path from 'path';

// Mock fs-extra
jest.mock('fs-extra');
const mockedFs = fs as jest.Mocked<typeof fs>;

// Mock path
jest.mock('path', () => ({
  ...jest.requireActual('path'),
  resolve: jest.fn(),
}));
const mockedPath = path as jest.Mocked<typeof path>;

describe('documentCommand', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Setup default mock implementations
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readdirSync.mockReturnValue(['Button.tsx', 'Icon.tsx']);
    mockedFs.readFileSync.mockReturnValue(`
      import React from 'react';
      
      interface ButtonProps {
        /** The variant of the button */
        variant: 'primary' | 'secondary';
        /** Click handler */
        onClick: () => void;
      }
      
      /**
       * A customizable button component.
       * @component
       */
      export const Button: React.FC<ButtonProps> = ({ variant, onClick }) => {
        return <button onClick={onClick}>Click me</button>;
      };
    `);
  });

  it('should generate documentation for components', async () => {
    // Setup path resolve mock
    mockedPath.resolve
      .mockReturnValueOnce('/path/to/components')  // componentsDir
      .mockReturnValueOnce('/path/to/output.json'); // outputFile

    // Execute command
    await documentCommand({ output: 'output.json' });

    // Verify components directory was checked
    expect(mockedFs.existsSync).toHaveBeenCalledWith('/path/to/components');

    // Verify component files were read
    expect(mockedFs.readdirSync).toHaveBeenCalledWith('/path/to/components');

    // Verify documentation was written
    expect(mockedFs.writeJSONSync).toHaveBeenCalledWith(
      '/path/to/output.json',
      expect.arrayContaining([
        expect.objectContaining({
          name: 'Button',
          props: expect.arrayContaining([
            expect.objectContaining({
              name: 'variant',
              type: 'enum',
              values: ['primary', 'secondary'],
            }),
            expect.objectContaining({
              name: 'onClick',
              type: 'function',
            }),
          ]),
        }),
      ]),
      expect.anything()
    );
  });

  it('should handle missing components directory', async () => {
    // Mock directory not existing
    mockedFs.existsSync.mockReturnValue(false);

    // Execute and verify error is thrown
    await expect(documentCommand({})).rejects.toThrow('Components directory not found');
  });

  it('should handle parse errors gracefully', async () => {
    // Mock invalid TypeScript file
    mockedFs.readFileSync.mockReturnValue('invalid typescript code');

    // Spy on console.warn
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

    // Execute command
    await documentCommand({ output: 'output.json' });

    // Verify warning was logged
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Could not fully parse')
    );

    consoleSpy.mockRestore();
  });

  it('should filter out test and type definition files', async () => {
    // Mock directory with various file types
    mockedFs.readdirSync.mockReturnValue([
      'Button.tsx',
      'Button.test.tsx',
      'Button.spec.tsx',
      'Button.d.ts',
      'Icon.tsx',
    ]);

    await documentCommand({ output: 'output.json' });

    // Verify only valid component files were processed
    expect(mockedFs.readFileSync).toHaveBeenCalledTimes(2);
    expect(mockedFs.readFileSync).toHaveBeenCalledWith(
      expect.stringContaining('Button.tsx'),
      'utf-8'
    );
    expect(mockedFs.readFileSync).toHaveBeenCalledWith(
      expect.stringContaining('Icon.tsx'),
      'utf-8'
    );
  });
});