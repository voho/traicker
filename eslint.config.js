// Flat ESLint config for TypeScript + React Hooks with unused imports autofix
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import unusedImports from 'eslint-plugin-unused-imports';

export default [
  // Ignore build artifacts and vendor directories
  {
    ignores: [
      'dist/**',
      'build/**',
      '.wrangler/**',
      'node_modules/**',
      '**/*.d.ts'
    ],
  },

  // Base JS recommended rules
  js.configs.recommended,

  // TypeScript recommended (no type-checking required)
  ...tseslint.configs.recommended,

  // Project rules
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    plugins: {
      'react-hooks': reactHooks,
      'unused-imports': unusedImports,
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // Auto-remove unused imports and flag unused vars (underscore-ignored)
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        { vars: 'all', varsIgnorePattern: '^_', args: 'after-used', argsIgnorePattern: '^_' }
      ],

      // Enforce React Hooks rules without needing the full React plugin
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // Common quality rules that are auto-fixable
      'no-unused-vars': 'off', // handled by unused-imports
      'no-undef': 'off', // TS handles this
      'no-console': 'off'
    },
  },
];

