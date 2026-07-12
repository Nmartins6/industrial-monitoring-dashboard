import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

import baseConfig from './base.js';

const reactSourceFiles = ['**/*.{js,mjs,jsx,ts,mts,tsx}'];

export default [
  ...baseConfig,
  {
    name: '@industrial-monitoring/eslint-config/react-browser',
    files: reactSourceFiles,
    languageOptions: {
      sourceType: 'module',
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
  },
  {
    ...reactHooks.configs.flat.recommended,
    name: '@industrial-monitoring/eslint-config/react-hooks',
    files: reactSourceFiles,
  },
  {
    ...reactRefresh.configs.vite,
    name: '@industrial-monitoring/eslint-config/react-refresh',
    files: reactSourceFiles,
  },
];
