# Code Quality Tools

This project uses several tools to maintain code quality and consistency:

## ESLint

ESLint is used for static code analysis and enforcing code style rules.

### Usage

- Run ESLint to check for issues:
  ```bash
  npx eslint src/**/*.ts
  ```

- Fix issues automatically:
  ```bash
  npx eslint --fix src/**/*.ts
  ```

### VSCode Integration

The project is configured to automatically run ESLint fixes on save. This is configured in `.vscode/settings.json`:

```json
{
    "editor.codeActionsOnSave": {
        "source.fixAll.eslint": true
    },
    "eslint.validate": ["typescript"],
    "[typescript]": {
        "editor.defaultFormatter": "dbaeumer.vscode-eslint"
    }
}
```

## Prettier

Prettier is used for code formatting.

### Usage

- Format all files:
  ```bash
  npx prettier --write "src/**/*.ts"
  ```

- Check formatting without making changes:
  ```bash
  npx prettier --check "src/**/*.ts"
  ```

### VSCode Integration

Prettier is configured to run on save. This is configured in `.vscode/settings.json`:

```json
{
    "editor.formatOnSave": true
}
```

## Import Sorting

The project uses `eslint-plugin-simple-import-sort` to automatically sort imports.

### Usage

Imports are automatically sorted when:
1. Running ESLint with the `--fix` flag
2. Saving files in VSCode (due to the ESLint auto-fix on save setting)

### Import Order

The plugin sorts imports in the following order:
1. Built-in Node.js modules
2. External packages
3. Internal modules
4. Parent/sibling imports
5. Index imports

## EditorConfig

EditorConfig is used to maintain consistent coding styles across different editors.

### Usage

The configuration is automatically applied when opening files in supported editors. No manual commands are needed.

## Available Scripts

The following scripts are available in `package.json`:

```json
{
    "scripts": {
        "lint": "eslint \"src/**/*.ts\"",
        "lint:fix": "eslint --fix \"src/**/*.ts\"",
        "format": "prettier --write \"src/**/*.ts\"",
        "format:check": "prettier --check \"src/**/*.ts\""
    }
}
```

## Best Practices

1. **Before Committing**:
   - Run `npm run lint:fix` to fix any linting issues
   - Run `npm run format` to ensure consistent formatting
   - Run `npm run format:check` to verify formatting

2. **In VSCode**:
   - Install the ESLint and Prettier extensions
   - Save files frequently to automatically apply fixes
   - Use the "Format Document" command (Shift+Alt+F) if needed

3. **Ignoring Rules**:
   - Use `// eslint-disable-next-line rule-name` for specific lines
   - Use `/* eslint-disable rule-name */` for blocks of code
   - Document why a rule is being disabled

## Troubleshooting

If you encounter issues with the tools:

1. **ESLint not working**:
   - Ensure the ESLint VSCode extension is installed
   - Check that the correct TypeScript version is being used
   - Run `npm install` to ensure all dependencies are up to date

2. **Prettier conflicts**:
   - Ensure Prettier is installed globally or locally
   - Check `.prettierrc` for configuration
   - Try running `npm run format` manually

3. **Import sorting issues**:
   - Ensure `eslint-plugin-simple-import-sort` is installed
   - Check `.eslintrc.js` for correct configuration
   - Try running `npm run lint:fix` manually 