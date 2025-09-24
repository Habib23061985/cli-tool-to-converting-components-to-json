import fs from 'fs-extra';
import path from 'path';

export interface Config {
  projectName: string;
  figmaToken: string;
  outputDirectory: string;
  componentsDir?: string;
  figmaFileId?: string;
  codeConnect: {
    include: string[];
    parser: string;
  };
}

export async function loadConfig(): Promise<Config | null> {
  const configPath = path.join(process.cwd(), 'figma-cli.config.json');

  try {
    if (await fs.pathExists(configPath)) {
      return await fs.readJson(configPath);
    }
  } catch (error) {
    console.warn('Warning: Could not load configuration file');
  }

  return null;
}

export async function saveConfig(config: Config): Promise<void> {
  const configPath = path.join(process.cwd(), 'figma-cli.config.json');
  await fs.writeJson(configPath, config, { spaces: 2 });
}
