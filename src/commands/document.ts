import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';
import { loadConfig } from '../utils/config';
import { parse, AST_NODE_TYPES, AST_TOKEN_TYPES } from '@typescript-eslint/typescript-estree';
import type { TSESTree } from '@typescript-eslint/types';

interface PropDocumentation {
  name: string;
  type: string;
  values?: string[];
  description: string;
}

interface ComponentDocumentation {
  name: string;
  props: PropDocumentation[];
  codeExample: string;
  importPath: string;
  documentation: string;
}

function extractComponentDocFromComments(
  comments: TSESTree.Comment[],
  componentName: string
): string {
  // Sort comments by line number in reverse order to get the closest one to the component
  const sortedComments = [...comments].sort((a, b) => 
    (b.loc?.start.line || 0) - (a.loc?.start.line || 0)
  );

  for (const comment of sortedComments) {
    if (comment.type === AST_TOKEN_TYPES.Block && comment.value.startsWith('*')) {
      const docText = comment.value
        .replace(/^\s*\*+/, '') // Remove initial asterisks
        .replace(/\n\s*\*\s*/g, '\n') // Clean up line starts
        .replace(/@example\s*\n/g, '@example\n') // Normalize @example tags
        .replace(/```tsx?\s*\n/g, '```tsx\n') // Normalize code blocks
        .replace(/\n+/g, '\n') // Normalize multiple newlines
        .trim();
      
      // Check if this comment is likely about the component
      if (docText.toLowerCase().includes(componentName.toLowerCase()) || 
          docText.toLowerCase().includes('component') ||
          docText.includes('@component') ||
          docText.includes('@description')) {
        return docText;
      }
    }
  }
  return '';
}

function extractPropType(
  typeNode: TSESTree.TypeNode,
  fileContent: string
): { type: string; values?: string[] } {
  // Handle union types
  if (typeNode.type === AST_NODE_TYPES.TSUnionType) {
    const literals = typeNode.types
      .filter((t): t is TSESTree.TSLiteralType => t.type === AST_NODE_TYPES.TSLiteralType)
      .map(t => {
        if ('literal' in t && t.literal && 'value' in t.literal) {
          return String(t.literal.value);
        }
        return '';
      })
      .filter(Boolean);
    
    if (literals.length > 0) {
      return { type: 'enum', values: literals };
    }

    // Handle union of basic types (e.g., string | number)
    const types = typeNode.types.map(t => {
      const typeText = fileContent.slice(t.range?.[0] || 0, t.range?.[1] || 0);
      return normalizeType(typeText);
    });
    return { type: types.join(' | ') };
  }

  function normalizeType(type: string): string {
    const normalized = type.toLowerCase()
      .replace(/\s+/g, '')
      .replace('react.', '')
      .replace('react.', '')
      .replace(/\breactnode\b/, 'ReactNode')
      .replace(/\bfunctioncomponent\b/, 'FC')
      .replace('() => void', 'function')
      .replace('boolean', 'bool')
      .replace(/(\w+)\[\]/, 'array')
      .replace(/promise<.*>/, 'Promise')
      .replace(/<.*>/g, '');  // Remove generic type parameters
    
    // Special case for function types
    if (normalized.includes('=>')) {
      const params = normalized.split('=>')[0].trim();
      const returnType = normalized.split('=>')[1].trim();
      return `(${params}) => ${returnType}`;
    }

    return normalized;
  }

  const typeText = fileContent
    .slice(typeNode.range?.[0] || 0, typeNode.range?.[1] || 0);

  // Handle array types
  if (typeNode.type === AST_NODE_TYPES.TSArrayType) {
    const elementType = fileContent
      .slice(typeNode.elementType.range?.[0] || 0, typeNode.elementType.range?.[1] || 0);
    return { type: `${normalizeType(elementType)}[]` };
  }

  // Handle function types
  if (typeNode.type === AST_NODE_TYPES.TSFunctionType) {
    return { type: 'function' };
  }

  return { type: normalizeType(typeText) };
}

/**
 * Generates a code example for a component based on its props
 */
function generateCodeExample(componentName: string, props: PropDocumentation[]): string {
  const propExamples = props.map(prop => {
    const name = prop.name;
    
    // Handle union types
    if (prop.type.includes('|')) {
      const types = prop.type.split('|').map(t => t.trim());
      if (types.includes('string')) return `${name}="example"`;
      if (types.includes('number')) return `${name}={42}`;
      if (types.includes('bool')) return `${name}={false}`;
      return `${name}={${types[0].toLowerCase()}}`;
    }

    switch (prop.type.toLowerCase()) {
      case 'string':
        return `${name}="example"`;
      case 'number':
        return `${name}={42}`;
      case 'bool':
      case 'boolean':
        return `${name}={false}`;
      case 'function':
        return `${name}={(${name.startsWith('on') ? 'event' : 'value'}) => ` +
               `console.log('${name}:', ${name.startsWith('on') ? 'event' : 'value'})}`;
      case 'enum':
        return prop.values?.[0] ? `${name}="${prop.values[0]}"` : null;
      case 'array':
        return `${name}={[]}`;
      case 'reactnode':
        return null; // Will be added as children
      case '(option: dropdownoption) => reactnode':
        return `${name}={option => <span>{option.label}</span>}`;
      default:
        // Handle array types
        if (prop.type.endsWith('[]')) {
          return `${name}={[]}`;
        }
        // Handle function types
        if (prop.type.includes('=>')) {
          return `${name}={() => {}}`;
        }
        return `${name}={/* example for ${prop.type} */}`;
    }
  }).filter(Boolean);

  if (props.some(p => p.type === 'reactnode')) {
    return `<${componentName}${propExamples.length ? ' ' + propExamples.join(' ') : ''}>
  Content
</${componentName}>`;
  }

  return `<${componentName}${propExamples.length ? ' ' + propExamples.join(' ') : ''} />`;
}

/**
 * Generates component documentation in JSON format for all components in the src/components directory
 */
export async function documentCommand(options: { output?: string }): Promise<void> {
  console.log(chalk.blue('📚 Generating component documentation...\n'));

  const componentsDir = path.resolve(process.cwd(), '../src/components');
  const outputFile = path.resolve(process.cwd(), options.output || '../docs/components.json');
  
  const spinner = ora('Analyzing components...').start();

  try {
    if (!fs.existsSync(componentsDir)) {
      throw new Error('Components directory not found: ' + componentsDir);
    }

    const files = fs.readdirSync(componentsDir)
      .filter(file => /\.(tsx?|jsx?)$/.test(file))
      .filter(file => !file.includes('.test.') && !file.includes('.spec.') && !file.includes('.d.ts'));

    const documentation: ComponentDocumentation[] = [];

    for (const file of files) {
      const filePath = path.join(componentsDir, file);
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      
      try {
        const ast = parse(fileContent, {
          jsx: true,
          comment: true,
          loc: true,
          range: true,
          tokens: true,
        });

        const componentName = file.replace(/\.(tsx?|jsx?)$/, '');
        const props: PropDocumentation[] = [];

        // Get component documentation from JSDoc comments
        const componentDoc = extractComponentDocFromComments(ast.comments, componentName);

        // Look for exported interface declarations
        for (const node of ast.body) {
          // Handle both direct interface declarations and exported ones
          let interfaceNode: TSESTree.TSInterfaceDeclaration | null = null;

          if (node.type === AST_NODE_TYPES.TSInterfaceDeclaration && 
              node.id.name.includes('Props')) {
            interfaceNode = node;
          } else if (node.type === AST_NODE_TYPES.ExportNamedDeclaration && 
                    node.declaration?.type === AST_NODE_TYPES.TSInterfaceDeclaration &&
                    node.declaration.id.name.includes('Props')) {
            interfaceNode = node.declaration;
          }

          if (interfaceNode) {
            for (const prop of interfaceNode.body.body) {
              if (prop.type === AST_NODE_TYPES.TSPropertySignature && 
                  prop.key.type === AST_NODE_TYPES.Identifier) {
                const name = prop.key.name;
                
                // Get prop description from nearby comments
                const propComments = ast.comments.filter(comment => 
                  comment.loc?.end.line === prop.loc?.start.line - 1
                );

                const description = propComments.length > 0
                  ? propComments[0].value
                      .replace(/^\s*\*+/, '')
                      .replace(/\n\s*\*\s*/g, ' ')
                      .trim()
                  : `${name} property`;

                if (prop.typeAnnotation?.typeAnnotation) {
                  const { type, values } = extractPropType(
                    prop.typeAnnotation.typeAnnotation,
                    fileContent
                  );

                  props.push({
                    name,
                    type,
                    ...(values && { values }),
                    description
                  });
                }
              }
            }
          }
        }

        if (props.length > 0) {
          documentation.push({
            name: componentName,
            props,
            codeExample: generateCodeExample(componentName, props),
            importPath: `./src/components/${componentName}`,
            documentation: componentDoc || `${componentName} component`
          });
        }
      } catch (parseError: any) {
        console.warn(chalk.yellow(`Warning: Could not fully parse ${file}: ${parseError.message}`));
      }
    }

    // Sort components alphabetically
    documentation.sort((a, b) => a.name.localeCompare(b.name));

    // Ensure docs directory exists
    const docsDir = path.dirname(outputFile);
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }

    fs.writeJSONSync(outputFile, documentation, { spaces: 2 });

    spinner.succeed('Documentation generated successfully!');

    console.log(chalk.green('\n✅ Documentation file created:'));
    console.log(chalk.cyan(`📄 ${outputFile}`));
    
  } catch (error: any) {
    spinner.fail('Failed to generate documentation');
    console.error(chalk.red('Error:'), error.message);
    process.exit(1);
  }
}