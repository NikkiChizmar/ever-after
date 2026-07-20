import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * Single ESLint flat config for the whole workspace.
 * One source of truth for code quality; per-area blocks below layer on
 * environment-specific rules (browser globals + React rules for the client,
 * Node globals for the server). `prettier` comes last to disable any
 * stylistic rules that would fight the formatter.
 */
export default tseslint.config(
  { ignores: ['**/dist/', '**/node_modules/', '**/coverage/'] },

  // Base: all TypeScript everywhere
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    rules: {
      // An underscore prefix marks a parameter as intentionally unused —
      // e.g. Express error handlers must keep their 4-arg signature.
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },

  // Client: browser environment + React correctness rules
  {
    files: ['client/**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },

  // shadcn/ui primitives conventionally export cva variants (buttonVariants)
  // alongside the component; exempt them from the fast-refresh-only rule.
  {
    files: ['client/src/components/ui/**/*.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },

  // Server: Node environment
  {
    files: ['server/**/*.ts'],
    languageOptions: {
      globals: globals.node,
    },
  },

  prettier,
);
