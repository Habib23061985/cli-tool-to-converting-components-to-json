import { loadConfig } from '../utils/config';
import fs from 'fs-extra';
import path from 'path';

jest.mock('fs-extra');
const mockedFs = fs as jest.Mocked<typeof fs>;

jest.mock('path', () => ({
  ...jest.requireActual('path'),
  resolve: jest.fn(),
}));
const mockedPath = path as jest.Mocked<typeof path>;

describe('Config Utils', () => {
  describe('loadConfig', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should load configuration from file', async () => {
      // Mock config file content
      const mockConfig = {
        componentsDir: './src/components',
        outputDir: './docs',
        includes: ['**/*.tsx'],
        excludes: ['**/*.test.tsx'],
      };

      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readJSON.mockResolvedValue(mockConfig);
      mockedPath.resolve.mockReturnValue('/path/to/config');

      const config = await loadConfig();

      expect(config).toEqual(mockConfig);
      expect(mockedFs.existsSync).toHaveBeenCalled();
      expect(mockedFs.readJSON).toHaveBeenCalled();
    });

    it('should return default config when file not found', async () => {
      mockedFs.existsSync.mockReturnValue(false);
      mockedPath.resolve.mockReturnValue('/path/to/config');

      const config = await loadConfig();

      expect(config).toEqual(expect.objectContaining({
        componentsDir: expect.any(String),
        outputDir: expect.any(String),
      }));
    });

    it('should handle invalid config file', async () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readJSON.mockRejectedValue(new Error('Invalid JSON'));
      mockedPath.resolve.mockReturnValue('/path/to/config');

      await expect(loadConfig()).rejects.toThrow('Failed to load config');
    });
  });
});