import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import unusedImports from 'eslint-plugin-unused-imports';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '.vite-no-cache/**',
      'public/**',
      // ignore all JS files outside src (built files, config scripts)
      '**/*.js',
      '**/*.cjs',
      '**/*.mjs',
      // but allow TS in src
    ],
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'unused-imports': unusedImports,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // Reduce noise to get to zero errors quickly
      '@typescript-eslint/no-unused-vars': 'off',
      // Remove unused imports automatically and prefer _-prefixed unused vars
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        { vars: 'all', varsIgnorePattern: '^_', args: 'after-used', argsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'off',
      'no-empty': ['warn', { allowEmptyCatch: true }],
      'no-case-declarations': 'off',
      '@typescript-eslint/no-unused-expressions': [
        'error',
        {
          allowShortCircuit: true,
          allowTernary: true,
          allowTaggedTemplates: true,
          enforceForJSX: false,
        },
      ],
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      // Forbid legacy adapter to ensure direct Supabase usage
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            '**/hooks/useLocalStorage',
            './src/hooks/useLocalStorage',
            '@/hooks/useLocalStorage',
          ],
        },
      ],
    },
  }
);
