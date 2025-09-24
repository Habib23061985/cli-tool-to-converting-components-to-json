import chalk from 'chalk';
import ora from 'ora';
import { execAsync } from '../utils/exec';
import { loadConfig } from '../utils/config';

interface PublishOptions {
  token?: string;
  dryRun?: boolean;
}

export async function publishCommand(options: PublishOptions) {
  console.log(chalk.blue('📤 Publishing Code Connect files to Figma...\n'));

  const config = await loadConfig();
  const token = options.token || config?.figmaToken || process.env.FIGMA_ACCESS_TOKEN;

  if (!token) {
    console.error(chalk.red('❌ Figma access token is required. Use --token or run "figma-tool init"'));
    process.exit(1);
  }

  const spinner = ora('Publishing to Figma...').start();

  try {
    const command = options.dryRun 
      ? `figma connect status --token ${token}`
      : `figma connect publish --token ${token}`;

    const result = await execAsync(command);

    spinner.succeed(options.dryRun ? 'Dry run completed!' : 'Published successfully!');

    console.log(chalk.green('\n✅ Result:'));
    console.log(result.stdout);

    if (result.stderr) {
      console.log(chalk.yellow('\nWarnings:'));
      console.log(result.stderr);
    }

  } catch (error: any) {
    spinner.fail('Failed to publish');
    console.error(chalk.red('Error:'), error.message);
    process.exit(1);
  }
}
