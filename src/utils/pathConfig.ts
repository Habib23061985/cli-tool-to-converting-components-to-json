import path from 'path';

interface PathConfig {
  componentsDir: string;
  baseDir: string;
}

const defaultConfig: PathConfig = {
  componentsDir: 'src/components',
  baseDir: '.'
};

let currentConfig = { ...defaultConfig };

export function setPathConfig(config: Partial<PathConfig>): void {
  currentConfig = { ...currentConfig, ...config };
}

export function getComponentPath(componentName: string): string {
  return path.join(currentConfig.baseDir, currentConfig.componentsDir, componentName);
}

export function getRelativeComponentPath(componentName: string): string {
  return `./${path.join(currentConfig.componentsDir, componentName)}`;
}

export function setComponentsDir(dir: string): void {
  currentConfig.componentsDir = dir;
}

export function setBaseDir(dir: string): void {
  currentConfig.baseDir = dir;
}

export default {
  setPathConfig,
  getComponentPath,
  getRelativeComponentPath,
  setComponentsDir,
  setBaseDir
};