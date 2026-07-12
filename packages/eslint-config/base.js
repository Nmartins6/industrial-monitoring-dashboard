import js from '@eslint/js';
import tseslint from 'typescript-eslint';

const sourceFiles = ['**/*.{js,mjs,cjs,ts,mts,cts}'];

export default [
  {
    name: '@industrial-monitoring/eslint-config/ignores',
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/.turbo/**',
      '**/playwright-report/**',
      '**/test-results/**',
      '**/blob-report/**',
      '**/.test-dist/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    name: '@industrial-monitoring/eslint-config/base',
    files: sourceFiles,
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
    },
    rules: {
      curly: ['error', 'all'],
      eqeqeq: ['error', 'always'],
      'no-debugger': 'error',
      'no-duplicate-imports': 'error',
      'object-shorthand': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          fixStyle: 'inline-type-imports',
        },
      ],
    },
  },
];
