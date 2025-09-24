# Component Documentation Generator CLI Tool

A powerful command-line tool for automatically generating comprehensive documentation for React components in TypeScript/JavaScript projects. This tool analyzes your component files and creates structured JSON documentation including props, types, examples, and descriptions.

## Features

- 📝 Automatic documentation generation from TypeScript/JavaScript files
- 🔍 Extracts prop types, descriptions, and default values
- 💡 Generates code examples automatically
- 🎨 Support for complex types (unions, enums, etc.)
- 📚 JSDoc comment parsing
- ⚛️ React-specific type handling
- 🔄 Supports component inheritance and composition

## Installation

```bash
# Install dependencies
npm install

# Build the tool
npm run build

# Run locally
node ./dist/index.js
```

## Commands

### 1. Initialize Project (`init`)

Creates a configuration file for the documentation generator.

```bash
# Initialize with default settings
node ./dist/index.js init

# Initialize in a specific directory
node ./dist/index.js init --dir ./my-components
```

Configuration options in `.component-docs.json`:
```json
{
  "componentsDir": "./src/components",
  "outputDir": "./docs",
  "includes": ["**/*.tsx", "**/*.jsx"],
  "excludes": ["**/*.test.tsx", "**/*.stories.tsx"]
}
```

### 2. Generate Documentation (`document`)

Analyzes your components and generates documentation in JSON format.

```bash
# Generate documentation with default settings
node ./dist/index.js document

# Specify custom output path
node ./dist/index.js document --output ./custom-docs/components.json
```

Example output structure:
```json
[
  {
    "name": "Button",
    "props": [
      {
        "name": "variant",
        "type": "enum",
        "values": ["primary", "secondary"],
        "description": "Visual style variant of the button"
      }
    ],
    "codeExample": "<Button variant=\"primary\">Click me</Button>",
    "documentation": "A reusable button component..."
  }
]
```

### 3. List Components (`list`)

Lists all available components in your project.

```bash
# List all components
node ./dist/index.js list

# List with detailed information
node ./dist/index.js list --detailed
```

Example output:
```
📦 Components Found: 5
├── Button (./src/components/Button.tsx)
├── ButtonGroup (./src/components/ButtonGroup.tsx)
├── Dropdown (./src/components/Dropdown.tsx)
├── Icon (./src/components/Icon.tsx)
└── ColorPicker (./src/components/ColorPicker.tsx)
```

## Usage Examples

### Basic Usage

1. Initialize in your project:
```bash
cd your-react-project
node ./dist/index.js init
```

2. Generate documentation:
```bash
node ./dist/index.js document
```

### Advanced Usage

1. Generate documentation with specific output path:
```bash
node ./dist/index.js document --output ./docs/api.json
```

2. List available components:
```bash
node ./dist/index.js list --detailed
```

## Documentation Features

### Supported Component Types

1. Function Components:
```typescript
interface ButtonProps {
  /** The variant of the button */
  variant: 'primary' | 'secondary';
  /** Click handler */
  onClick: () => void;
}

export const Button: React.FC<ButtonProps> = (props) => {
  // Component implementation
};
```

2. Class Components:
```typescript
interface CardProps {
  /** The title of the card */
  title: string;
  /** Card content */
  children: React.ReactNode;
}

export class Card extends React.Component<CardProps> {
  // Component implementation
}
```

### JSDoc Documentation

The tool extracts documentation from JSDoc comments:

```typescript
/**
 * A customizable button component.
 * @component
 * @example
 * ```tsx
 * <Button variant="primary" onClick={() => alert('Clicked!')}>
 *   Click me
 * </Button>
 * ```
 */
export const Button: React.FC<ButtonProps> = (props) => {
  // ...
};
```

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## AI Assistant Instructions

This section provides structured instructions for AI assistants to help users with this tool.

### Installation Process

1. **Repository Setup**:
```bash
# Clone the repository
git clone https://github.com/Habib23061985/cli-tool-to-converting-components-to-json.git

# Navigate to project directory
cd cli-tool-to-converting-components-to-json

# Install dependencies
npm install

# Build the project
npm run build
```

2. **Verification Steps**:
```bash
# Verify the build
ls ./dist  # Should show compiled files

# Test the CLI
node ./dist/index.js --help
```

### Integration Process

1. **Project Analysis**:
- Check for `src/components` directory in the target project
- Verify TypeScript/React components with proper types
- Look for existing documentation comments

2. **Configuration Setup**:
```bash
# Create configuration
node ./dist/index.js init

# Verify configuration
cat .component-docs.json
```

3. **Documentation Generation**:
```bash
# Generate docs
node ./dist/index.js document

# Verify output
cat ./docs/components.json
```

### Troubleshooting Guide

When encountering issues, follow this sequence:

1. **Build Issues**:
```bash
# Clean build files
rm -rf ./dist

# Rebuild
npm run build
```

2. **Parse Errors**:
- Check component file syntax
- Verify TypeScript types are properly defined
- Ensure JSDoc comments are well-formed

3. **Output Issues**:
- Verify output directory exists and is writable
- Check component paths in configuration
- Validate JSON output format

### AI Decision Tree

Follow this decision tree when assisting users:

1. **Project State Assessment**:
   ```typescript
   if (!hasTypeScript) {
     suggestTypeScriptSetup();
   } else if (!hasComponents) {
     suggestComponentStructure();
   } else {
     proceedWithDocumentation();
   }
   ```

2. **Documentation Strategy**:
   ```typescript
   if (hasExistingDocs) {
     updateExistingDocs();
   } else {
     createNewDocs();
   }
   ```

3. **Component Analysis**:
   ```typescript
   for (const component of components) {
     if (needsTypeDefinition) {
       suggestPropTypes();
     }
     if (needsJSDoc) {
       suggestDocComments();
     }
     generateDocumentation();
   }
   ```

### Example AI Workflows

1. **New Project Setup**:
```typescript
async function setupNewProject() {
  await verifyEnvironment();
  await initializeConfig();
  await suggestComponentStructure();
  await generateInitialDocs();
}
```

2. **Documentation Update**:
```typescript
async function updateDocumentation() {
  await validateExistingDocs();
  await identifyChangedComponents();
  await regenerateDocumentation();
  await validateOutput();
}
```

3. **Component Migration**:
```typescript
async function migrateComponents() {
  await analyzeSourceComponents();
  await setupTargetStructure();
  await transferComponents();
  await updateDocumentation();
}
```

### AI Response Templates

1. **Installation Help**:
```markdown
I'll help you install the documentation generator:
1. First, let's clone the repository
2. Then install dependencies
3. Finally build the project
Would you like me to proceed with these steps?
```

2. **Documentation Generation**:
```markdown
To generate documentation for your components:
1. I'll help you initialize the configuration
2. We'll verify your component structure
3. Then generate the documentation
Shall we begin with the initialization?
```

3. **Troubleshooting**:
```markdown
I notice there might be an issue with [specific problem].
Let's try these steps:
1. [First solution]
2. [Alternative approach]
3. [Fallback option]
Which approach would you prefer to try first?
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
