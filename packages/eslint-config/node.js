import globals from 'globals';

import baseConfig from './base.js';

const esmFiles = ['**/*.{js,mjs,ts,mts}'];
const commonJsFiles = ['**/*.{cjs,cts}'];

export default [
  ...baseConfig,
  {
    name: '@industrial-monitoring/eslint-config/node-esm',
    files: esmFiles,
    languageOptions: {
      sourceType: 'module',
      globals: globals.nodeBuiltin,
    },
  },
  {
    name: '@industrial-monitoring/eslint-config/node-commonjs',
    files: commonJsFiles,
    languageOptions: {
      sourceType: 'commonjs',
      globals: globals.node,
    },
  },
];
