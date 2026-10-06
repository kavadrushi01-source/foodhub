import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  {
    ignores: ['dist', 'node_modules', '**/*.config.js'],
  },
  js.configs.recommended,
  react.configs.flat.recommended,
  react.configs.flat['jsx-runtime'],
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react/prop-types': 'off',
      // React 18 only forwards the all-lowercase `fetchpriority` attribute to
      // the DOM (camelCase fetchPriority is React 19+), so lowercase is correct here.
      'react/no-unknown-property': ['error', { ignore: ['fetchpriority'] }],
      'react/react-in-jsx-scope': 'off',
      'no-empty': ['warn', { allowEmptyCatch: true }],
      'react/no-unescaped-entities': ['error', { forbid: ['>', '}', '"'] }],
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
    settings: {
      react: { version: 'detect' },
    },
  },
];