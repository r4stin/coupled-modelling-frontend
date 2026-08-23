import js from '@eslint/js';
import prettierConfig from 'eslint-config-prettier';
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import noRelativeImportPaths from 'eslint-plugin-no-relative-import-paths';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import { configs as tsConfigs } from 'typescript-eslint';

/** @type {import('eslint').Linter.Config[]} */
export default [
    {
        ignores: ['next.config.ts', '*.mjs', '.next/**', 'node_modules/**'],
    },

    js.configs.recommended,
    ...tsConfigs.recommended,
    ...nextCoreWebVitals,

    {
        plugins: {
            'simple-import-sort': simpleImportSort,
            'no-relative-import-paths': noRelativeImportPaths,
        },
        linterOptions: {
            reportUnusedDisableDirectives: 'error',
        },
        rules: {
            'simple-import-sort/imports': 'error',
            'simple-import-sort/exports': 'error',
            'no-relative-import-paths/no-relative-import-paths': ['warn', { rootDir: 'src' }],
        },
    },

    prettierConfig,
];
