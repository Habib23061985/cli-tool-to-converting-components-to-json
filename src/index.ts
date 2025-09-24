#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { version } from '../package.json';
import { initCommand } from './commands/init';
import { convertCommand } from './commands/convert';
import { publishCommand } from './commands/publish';
import { listCommand } from './commands/list';
import { documentCommand } from './commands/document';

const program = new Command();

// Add description and version
program
  .name('figma-tool')
  .description('CLI tool for Figma design system automation')
  .version(version);

program
  .name('figma-tool')
  .description('CLI tool for Figma design system automation')
  .version(version);

// Add commands
program
  .command('init')
  .description('Initialize a new Figma project configuration')
  .option('-f, --force', 'Force overwrite existing configuration')
  .action(initCommand);

program
  .command('convert')
  .description('Convert Figma components to React code')
  .argument('<figma-url>', 'Figma component URL')
  .argument('<component-name>', 'Name of the React component to generate')
  .option('-o, --output <path>', 'Output directory', './src/components')
  .option('-t, --token <token>', 'Figma access token')
  .action(convertCommand);

program
  .command('publish')
  .description('Publish code connect files to Figma')
  .option('-t, --token <token>', 'Figma access token')
  .option('-d, --dry-run', 'Show what would be published without actually publishing')
  .action(publishCommand);

program
  .command('list')
  .description('List available Figma components')
  .argument('<figma-file-url>', 'Figma file URL')
  .option('-t, --token <token>', 'Figma access token')
  .action(listCommand);

// Add documentation command
program
  .command('document')
  .description('Generate documentation for React components in JSON format')
  .option('-o, --output <path>', 'Output file path', '../docs/components.json')
  .action(documentCommand);

// Error handling
program.exitOverride();

try {
  program.parse();
} catch (error: any) {
  console.error(chalk.red('Error:'), error.message);
  process.exit(1);
}
