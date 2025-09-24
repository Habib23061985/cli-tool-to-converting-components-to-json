import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';

interface InitOptions {
  force?: boolean;
}

export async function initCommand(options: InitOptions) {
  console.log(chalk.blue('🚀 Initializing Figma CLI tool...\n'));

  const configPath = path.join(process.cwd(), 'figma-cli.config.json');

  if (fs.existsSync(configPath) && !options.force) {
    console.log(chalk.yellow('⚠️  Configuration file already exists. Use --force to overwrite.'));
    return;
  }

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'projectName',
      message: 'What is your project name?',
      default: path.basename(process.cwd())
    },
    {
      type: 'input',
      name: 'figmaToken',
      message: 'Enter your Figma access token:',
      validate: (input) => input.length > 0 || 'Token is required'
    },
    {
      type: 'input',
      name: 'outputDir',
      message: 'Where should components be generated?',
      default: './src/components'
    },
    {
      type: 'input',
      name: 'figmaFileId',
      message: 'Enter your main Figma file ID (optional):',
    }
  ]);

  const config = {
    projectName: answers.projectName,
    figmaToken: answers.figmaToken,
    outputDirectory: answers.outputDir,
    figmaFileId: answers.figmaFileId || null,
    codeConnect: {
      include: ["**/*.figma.tsx"],
      parser: "react"
    }
  };

  const spinner = ora('Creating configuration file...').start();

  try {
    await fs.writeJson(configPath, config, { spaces: 2 });

    // Create output directory if it doesn't exist
    await fs.ensureDir(answers.outputDir);

    // Create .env file
    const envPath = path.join(process.cwd(), '.env');
    const envContent = `FIGMA_ACCESS_TOKEN=${answers.figmaToken}\n`;
    await fs.writeFile(envPath, envContent);

    spinner.succeed('Configuration created successfully!');

    console.log(chalk.green('\n✅ Setup complete!'));
    console.log(chalk.cyan(`📁 Output directory: ${answers.outputDir}`));
    console.log(chalk.cyan(`⚙️  Config file: figma-cli.config.json`));
    console.log(chalk.cyan(`🔐 Environment: .env`));

  } catch (error) {
    spinner.fail('Failed to create configuration');
    console.error(chalk.red('Error:'), error);
  }
}
