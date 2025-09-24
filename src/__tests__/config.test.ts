import { loadConfig } from '../utils/config';
import fs from 'fs-extra';
import path from 'path';

jest.mock('fs-extra');
const mockedFs = fs as unknown as {
  pathExists: jest.SpyInstance<Promise<boolean>>;
  readJson: jest.SpyInstance<Promise<any>>;
  writeJson: jest.SpyInstance<Promise<void>>;
};

describe('Config Utils', () => {
  describe('loadConfig', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should load configuration from file', async () => {
      // Mock config file content
      const mockConfig = {
        projectName: 'test-project',
        figmaToken: 'test-token',
        outputDirectory: './src',
        codeConnect: {
          include: ['**/*.tsx'],
          parser: 'typescript'
        }
      };

      mockedFs.pathExists.mockResolvedValue(true);
      mockedFs.readJson.mockResolvedValue(mockConfig);

      const config = await loadConfig();

      expect(config).toEqual(mockConfig);
      expect(mockedFs.pathExists).toHaveBeenCalledWith(expect.stringContaining('figma-cli.config.json'));
      expect(mockedFs.readJson).toHaveBeenCalledWith(expect.stringContaining('figma-cli.config.json'));
    });

    it('should return null when file not found', async () => {
      mockedFs.pathExists.mockResolvedValue(false);

      const config = await loadConfig();

      expect(config).toBeNull();
    });

    it('should handle invalid JSON errors', async () => {
      mockedFs.pathExists.mockResolvedValue(true);
      mockedFs.readJson.mockRejectedValue(new Error('Invalid JSON'));
      
      const config = await loadConfig();
      
      expect(config).toBeNull();
    });

    it('should handle other file system errors', async () => {
      mockedFs.pathExists.mockRejectedValue(new Error('Access denied'));
      
      const config = await loadConfig();
      
      expect(config).toBeNull();
    });

    it('should handle invalid config file', async () => {
      mockedFs.readJson.mockResolvedValue({ invalidConfig: true });
      
      const config = await loadConfig();
      expect(config).toBeNull();
    });
  });
});