import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

const EXT = 'apps/extension/src';

/** Forbids imports of outer layers and browser globals inside an inner layer. */
function layer(name, forbidden, { typeOnly = [] } = {}) {
  const dir = (l) => (l.startsWith('@') ? l : `**/${l}/**`);
  return [
    {
      files: [`${EXT}/${name}/**/*.{ts,tsx}`],
      rules: {
        '@typescript-eslint/no-restricted-imports': [
          'error',
          {
            paths: ['#i18n', 'react'].map((p) => ({
              name: p,
              message: `${name} must not use ${p}.`,
            })),
            patterns: [
              { group: forbidden.map(dir), message: `${name} must not depend on outer layers.` },
              ...typeOnly.map((l) => ({
                group: [dir(l)],
                allowTypeImports: true,
                message: `${name} may only import types from ${l}.`,
              })),
            ],
          },
        ],
        'no-restricted-globals': [
          'error',
          ...['browser', 'chrome'].map((g) => ({
            name: g,
            message: `${name} must not touch ${g}.*`,
          })),
        ],
      },
    },
  ];
}

export default tseslint.config(
  {
    ignores: [
      '**/node_modules',
      '**/.output',
      '**/.wxt',
      '**/dist',
      '**/coverage',
      '**/playwright-report',
      '**/test-results',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  // Clean Architecture: dependencies point inward (ui/infra → application → domain → core).
  ...layer('domain', ['application', 'infra', 'ui', 'content']),
  ...layer('application', ['infra', 'ui', 'content']),
  ...layer('content', ['infra', 'ui'], { typeOnly: ['application', '@mocado/core'] }),
  {
    files: ['**/*.tsx'],
    plugins: { 'react-hooks': reactHooks },
    rules: reactHooks.configs.recommended.rules,
  },
);
