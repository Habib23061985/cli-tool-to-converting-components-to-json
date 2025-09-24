import chalk from 'chalk';
import ora from 'ora';
import { loadConfig } from '../utils/config';
import { FigmaAPI } from '../services/figma-api';

interface ListOptions {
  token?: string;
}

export async function listCommand(figmaFileUrl: string, options: ListOptions) {
  console.log(chalk.blue('📋 Listing Figma components...\n'));

  const config = await loadConfig();
  const token = options.token || config?.figmaToken || process.env.FIGMA_ACCESS_TOKEN;

  if (!token) {
    console.error(chalk.red('❌ Figma access token is required. Use --token or run "figma-tool init"'));
    process.exit(1);
  }

  const spinner = ora('Fetching components from Figma...').start();

  try {
    const figmaApi = new FigmaAPI(token);

    // Extract file ID from URL
    const urlMatch = figmaFileUrl.match(/file\/([a-zA-Z0-9]+)/);

    if (!urlMatch) {
      throw new Error('Invalid Figma file URL format');
    }

    const fileId = urlMatch[1];
    const components = await figmaApi.getComponents(fileId);

    spinner.succeed('Components fetched successfully!');

    console.log(chalk.green(`\n✅ Found ${components.length} components:\n`));

    components.forEach((component: any, index: number) => {
      console.log(chalk.cyan(`${index + 1}. ${component.name}`));
      console.log(chalk.gray(`   ID: ${component.node_id}`));
      console.log(chalk.gray(`   Type: ${component.type}`));
      if (component.description) {
        console.log(chalk.gray(`   Description: ${component.description}`));
      }
      console.log('');
    });

  } catch (error: any) {
    spinner.fail('Failed to fetch components');
    console.error(chalk.red('Error:'), error.message);
    process.exit(1);
  }
}
