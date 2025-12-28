import nextPlugin from '@next/eslint-plugin-next';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import typescriptPlugin from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import unusedImportsPlugin from 'eslint-plugin-unused-imports';
import importPlugin from 'eslint-plugin-import';
import prettierConfig from 'eslint-config-prettier';

export default [
    {
        ignores: [
            '.next/**',
            'node_modules/**',
            'out/**',
            'build/**',
            '*.config.js',
            '*.config.mjs',
        ],
    },
    {
        files: ['**/*.{js,jsx,ts,tsx}'],
        languageOptions: {
            parser: typescriptParser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
                ecmaFeatures: {
                    jsx: true,
                },
            },
        },
        plugins: {
            '@next/next': nextPlugin,
            react: reactPlugin,
            'react-hooks': reactHooksPlugin,
            '@typescript-eslint': typescriptPlugin,
            'unused-imports': unusedImportsPlugin,
            import: importPlugin,
        },
        settings: {
            react: {
                version: 'detect',
            },
            linkComponents: [
                'Hyperlink',
                { name: 'Link', linkAttribute: 'href' },
            ],
        },
        rules: {
            // Next.js Core Web Vitals
            '@next/next/no-html-link-for-pages': 'error',
            '@next/next/no-img-element': 'warn',

            // React
            'react/react-in-jsx-scope': 'off',
            'react/prop-types': 'off',
            'react/jsx-curly-brace-presence': 'warn',
            'react/jsx-key': [
                'warn',
                { checkFragmentShorthand: true, warnOnDuplicates: true },
            ],
            'react/jsx-no-target-blank': [
                'warn',
                { enforceDynamicLinks: 'always', warnOnSpreadAttributes: true },
            ],

            // React Hooks
            'react-hooks/rules-of-hooks': 'error',
            'react-hooks/exhaustive-deps': 'warn',

            // JavaScript/TypeScript
            'no-console': 'off',
            'no-unused-vars': 'off',
            'no-var': 'error',
            'no-extra-boolean-cast': 'warn',
            'no-empty-pattern': 'warn',
            'no-useless-escape': 'warn',
            eqeqeq: ['error', 'always'],
            'object-shorthand': ['warn', 'always'],
            'no-use-before-define': 'off',

            // TypeScript
            '@typescript-eslint/no-use-before-define': 'error',
            '@typescript-eslint/no-explicit-any': 'error',
            '@typescript-eslint/no-empty-function': 'warn',
            '@typescript-eslint/no-unused-vars': 'off',
            '@typescript-eslint/no-this-alias': 'warn',
            '@typescript-eslint/ban-ts-comment': 'warn',
            '@typescript-eslint/no-empty-interface': 'off',
            '@typescript-eslint/no-var-requires': 'warn',
            '@typescript-eslint/no-non-null-assertion': 'warn',

            // Unused Imports
            'unused-imports/no-unused-imports': 'warn',
            'unused-imports/no-unused-vars': [
                'warn',
                {
                    vars: 'all',
                    varsIgnorePattern: '^_',
                    args: 'after-used',
                    argsIgnorePattern: '^_',
                },
            ],

            // Code Quality
            'max-lines': ['warn', 500],
            'max-len': [
                'warn',
                120,
                { ignoreComments: true, ignorePattern: '^import .*' },
            ],

            // Import Organization
            'import/newline-after-import': ['warn', { count: 1 }],
            'import/order': [
                'warn',
                {
                    groups: [
                        ['builtin', 'external'],
                        ['internal'],
                        ['index', 'sibling'],
                    ],
                    'newlines-between': 'always',
                    alphabetize: {
                        order: 'asc',
                        caseInsensitive: true,
                    },
                },
            ],

            // Console usage restriction
            'no-restricted-syntax': [
                'warn',
                {
                    selector: "CallExpression[callee.object.name='console']",
                    message:
                        'Avoid direct log to console. Import and use logging functions from utils/console.ts instead.',
                },
            ],
        },
    },
    // Prettier (must be last to override conflicting rules)
    prettierConfig,
];
