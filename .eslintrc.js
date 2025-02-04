module.exports = {
  root: true,
  env: {
    node: true,
    es6: true,
    jest: true,
  },
  extends: ['athom', 'eslint:recommended', 'plugin:prettier/recommended'],
  parserOptions: {
    sourceType: 'module',
  },
  ignorePatterns: ['node_modules/*', 'build/*'],
  plugins: ['@typescript-eslint', 'prettier'],
  settings: {
    node: {
      resolvePaths: ['node_modules/@types'],
      tryExtensions: ['.js', '.json', '.node', '.ts', '.d.ts'],
    },
    'import/resolver': {
      node: {
        extensions: ['.js', '.ts', '.d.ts'],
      },
    },
  },
  overrides: [
    {
      files: ['**/*.ts', '**/*.d.ts'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        project: ['./tsconfig.json'],
      },
      extends: [
        'airbnb-typescript/base',
        'plugin:@typescript-eslint/recommended',
      ],
      rules: {
        'lines-between-class-members': 'off',
        '@typescript-eslint/lines-between-class-members': ['off'],
        'node/no-unsupported-features/es-syntax': [
          'error',
          { ignores: ['modules'] },
        ],
        'no-empty-pattern': ['warn'],
        '@typescript-eslint/no-unused-vars': ['warn'],
        '@typescript-eslint/no-empty-function': ['warn'],
        '@typescript-eslint/explicit-function-return-type': [
          'warn',
          {
            allowExpressions: true,
            allowConciseArrowFunctionExpressionsStartingWithVoid: true,
          },
        ],

        'prettier/prettier': ['off', {}, { usePrettierrc: true }],

        indent: ['off', 2],
      },
    },
  ],
};
