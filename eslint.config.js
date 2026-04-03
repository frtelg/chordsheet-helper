const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const reactPlugin = require('eslint-plugin-react');
const reactHooksPlugin = require('eslint-plugin-react-hooks');
const nextPlugin = require('@next/eslint-plugin-next');
const prettierPlugin = require('eslint-plugin-prettier');
const prettierConfig = require('eslint-config-prettier');

const reactRecommended = reactPlugin.configs.flat.recommended;
const reactJsxRuntime = reactPlugin.configs.flat['jsx-runtime'];
const reactHooksRecommended = reactHooksPlugin.configs.flat.recommended;
const tsRecommended = tsPlugin.configs['flat/recommended'];

module.exports = [
    {
        ignores: [
            '.next/**',
            'coverage/**',
            'node_modules/**',
            'next-env.d.ts',
            '**/*.spec.ts',
            '**/*.spec.tsx',
            '**/*.js',
        ],
    },
    {
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
            },
        },
        plugins: {
            '@typescript-eslint': tsPlugin,
            prettier: prettierPlugin,
        },
        rules: {
            ...tsRecommended[1].rules,
            ...tsRecommended[2].rules,
            ...prettierConfig.rules,
            'prettier/prettier': 'error',
            'arrow-body-style': 'off',
            'prefer-arrow-callback': 'off',
        },
    },
    {
        files: ['**/*.tsx'],
        languageOptions: {
            parserOptions: {
                ...reactRecommended.languageOptions?.parserOptions,
            },
        },
        settings: {
            react: {
                version: 'detect',
            },
        },
        plugins: {
            react: reactPlugin,
            'react-hooks': reactHooksPlugin,
            '@next/next': nextPlugin,
        },
        rules: {
            ...reactRecommended.rules,
            ...reactJsxRuntime.rules,
            ...reactHooksRecommended.rules,
            ...nextPlugin.configs.recommended.rules,
        },
    },
];
