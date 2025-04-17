# Code Quality Tools

This project uses several tools to maintain code quality and consistency:

## Pre-commit Hooks

The project uses Husky and lint-staged to automatically run code quality checks before each commit.

### Setup

1. Install the required packages:
   ```bash
   npm install --save-dev husky lint-staged
   ```

2. Initialize Husky:
   ```bash
   npx husky init
   ```

3. The setup is already configured in `package.json`:
   ```json
   {
     "lint-staged": {
       "src/**/*.ts": [
         "eslint --fix",
         "prettier --write"
       ]
     },
     "scripts": {
       "prepare": "husky install",
       "pre-commit": "lint-staged"
     }
   }
   ```

### Usage

The pre-commit hook automatically runs when you try to commit changes:
1. Only staged files are checked
2. ESLint runs with auto-fix
3. Prettier formats the files
4. If any issues are found that can't be automatically fixed, the commit is prevented

### Verification

To verify the pre-commit hook is working:

1. Make a change to a TypeScript file
2. Stage the change:
   ```bash
   git add <file>
   ```
3. Try to commit:
   ```bash
   git commit -m "test commit"
   ```
4. You should see the validators run automatically

### Troubleshooting

If the pre-commit hook isn't working:

1. Check if Husky is installed:
   ```bash
   ls -la .husky
   ```

2. Verify the pre-commit hook exists:
   ```bash
   cat .husky/pre-commit
   ```

3. Ensure the hook is executable:
   ```bash
   chmod +x .husky/pre-commit
   ```

4. Check package.json for correct configuration:
   ```bash
   cat package.json | grep -A 10 "lint-staged"
   ```

5. Try reinstalling Husky:
   ```bash
   npm run prepare
   ```

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