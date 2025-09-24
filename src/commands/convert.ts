import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';
import { loadConfig } from '../utils/config';
import { FigmaAPI } from '../services/figma-api';

interface ConvertOptions {
  output?: string;
  token?: string;
}

export async function convertCommand(
  figmaUrl: string, 
  componentName: string, 
  options: ConvertOptions
) {
  console.log(chalk.blue(`🎨 Converting Figma component to React...`));
  console.log(chalk.gray(`URL: ${figmaUrl}`));
  console.log(chalk.gray(`Component: ${componentName}\n`));

  const config = await loadConfig();
  const token = options.token || config?.figmaToken || process.env.FIGMA_ACCESS_TOKEN;

  if (!token) {
    console.error(chalk.red('❌ Figma access token is required. Use --token or run "figma-tool init"'));
    process.exit(1);
  }

  const outputDir = options.output || config?.outputDirectory || './src/components';
  const spinner = ora('Fetching component data from Figma...').start();

  try {
    const figmaApi = new FigmaAPI(token);

    // Extract file ID and node ID from URL
    const urlMatch = figmaUrl.match(/file\/([a-zA-Z0-9]+)/);
    const nodeMatch = figmaUrl.match(/node-id=([^&]+)/);

    if (!urlMatch || !nodeMatch) {
      throw new Error('Invalid Figma URL format');
    }

    const fileId = urlMatch[1];
    const nodeId = nodeMatch[1].replace(/%3A/g, ':');

    spinner.text = 'Generating React component...';

    // Here you would implement the actual conversion logic
    // For now, we'll create a placeholder component
    const componentCode = generateReactComponent(componentName, figmaUrl);

    // Ensure output directory exists
    await fs.ensureDir(outputDir);

    // Write component file
    const componentPath = path.join(outputDir, `${componentName}.tsx`);
    await fs.writeFile(componentPath, componentCode);

    // Create figma connect file
    const figmaConnectCode = generateFigmaConnect(componentName, figmaUrl);
    const figmaDir = path.join(process.cwd(), 'figma');
    await fs.ensureDir(figmaDir);
    const figmaConnectPath = path.join(figmaDir, `${componentName}.figma.tsx`);
    await fs.writeFile(figmaConnectPath, figmaConnectCode);

    spinner.succeed('Component generated successfully!');

    console.log(chalk.green('\n✅ Files created:'));
    console.log(chalk.cyan(`📄 ${componentPath}`));
    console.log(chalk.cyan(`🔗 ${figmaConnectPath}`));

  } catch (error: any) {
    spinner.fail('Failed to convert component');
    console.error(chalk.red('Error:'), error.message);
    process.exit(1);
  }
}

function generateReactComponent(componentName: string, figmaUrl: string): string {
  return `import React from 'react';

interface ${componentName}Props {
  // TODO: Add proper props based on Figma component
  children?: React.ReactNode;
  className?: string;
}

export const ${componentName}: React.FC<${componentName}Props> = ({ 
  children, 
  className 
}) => {
  return (
    <div className={className}>
      {/* TODO: Implement component based on Figma design */}
      {children}
    </div>
  );
};

// Generated from: ${figmaUrl}
`;
}

function generateFigmaConnect(componentName: string, figmaUrl: string): string {
  return `import figma from '@figma/code-connect/react';
import { ${componentName} } from '../src/components/${componentName}';

figma.connect(
  ${componentName},
  '${figmaUrl}',
  {
    props: {
      // TODO: Map Figma props to component props
      children: figma.string('Text'),
    },
    example: (props) => (
      <${componentName} {...props} />
    ),
  }
);
`;
}
