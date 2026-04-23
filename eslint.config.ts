import { globalIgnores } from 'eslint/config';
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript';
import stylistic from '@stylistic/eslint-plugin';
import pluginVitest from '@vitest/eslint-plugin';
import pluginOxlint from 'eslint-plugin-oxlint';
import pluginVue from 'eslint-plugin-vue';

// To allow more languages other than `ts` in `.vue` files, uncomment the following lines:
// import { configureVueProject } from '@vue/eslint-config-typescript'
// configureVueProject({ scriptLangs: ['ts', 'tsx'] })
// More info at https://github.com/vuejs/eslint-config-typescript/#advanced-setup

export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{vue,ts,mts,tsx}'],
  },

  globalIgnores(['**/dist/**', '**/dist-ssr/**', '**/coverage/**']),

  ...pluginVue.configs['flat/essential'],
  vueTsConfigs.recommended,

  {
    name: 'app/typescript-rules',
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },

  {
    name: 'app/stylistic-rules',
    plugins: {
      '@stylistic': stylistic,
    },
    rules: {
      '@stylistic/array-bracket-newline': ['warn', { multiline: true }],
      '@stylistic/array-bracket-spacing': 'warn',
      '@stylistic/array-element-newline': ['warn', { consistent: true, multiline: true }],
      '@stylistic/arrow-parens': ['warn', 'as-needed', { requireForBlockBody: true }],
      '@stylistic/arrow-spacing': 'warn',
      '@stylistic/brace-style': ['warn', 'stroustrup', { allowSingleLine: false }],
      '@stylistic/comma-dangle': [
        'warn',
        {
          arrays: 'always-multiline',
          objects: 'always-multiline',
          imports: 'always-multiline',
          exports: 'always-multiline',
          functions: 'never',
        },
      ],
      '@stylistic/comma-spacing': 'warn',
      '@stylistic/dot-location': ['warn', 'property'],
      '@stylistic/eol-last': ['warn', 'always'],
      '@stylistic/indent': ['warn', 2, { SwitchCase: 1 }],
      '@stylistic/key-spacing': 'warn',
      '@stylistic/no-extra-semi': 'warn',
      '@stylistic/no-mixed-operators': [
        'warn',
        {
          groups: [
            ['&', '|', '^', '~', '<<', '>>', '>>>'],
            ['==', '!=', '===', '!==', '>', '>=', '<', '<='],
            ['&&', '||'],
            ['in', 'instanceof'],
          ],
          allowSamePrecedence: true,
        },
      ],
      '@stylistic/no-multiple-empty-lines': [
        'warn',
        {
          max: 1,
          maxBOF: 0,
          maxEOF: 0,
        },
      ],
      '@stylistic/no-trailing-spaces': 'warn',
      '@stylistic/object-curly-newline': 'warn',
      '@stylistic/object-curly-spacing': ['warn', 'always'],
      '@stylistic/operator-linebreak': [
        'warn',
        'after',
        {
          overrides: {
            '=': 'ignore',
            '?': 'ignore',
            ':': 'ignore',
          },
        },
      ],
      '@stylistic/padded-blocks': ['warn', { blocks: 'never', switches: 'never' }],
      '@stylistic/padding-line-between-statements': [
        'warn',
        {
          blankLine: 'always',
          prev: '*',
          next: 'return',
        },
        {
          blankLine: 'always',
          prev: ['const', 'let', 'var'],
          next: ['expression'],
        },
        {
          blankLine: 'always',
          prev: ['expression', 'block-like'],
          next: ['const', 'let', 'var'],
        },
        {
          blankLine: 'always',
          prev: '*',
          next: ['block-like', 'export'],
        },
        {
          blankLine: 'always',
          prev: 'import',
          next: ['block-like', 'const', 'let', 'var', 'export', 'expression'],
        },
      ],
      '@stylistic/quote-props': ['warn', 'as-needed'],
      '@stylistic/quotes': ['warn', 'single'],
      '@stylistic/semi': ['warn', 'always'],
      '@stylistic/semi-spacing': 'warn',
      '@stylistic/semi-style': ['warn', 'last'],
      '@stylistic/space-before-function-paren': [
        'warn',
        {
          anonymous: 'always',
          named: 'never',
          asyncArrow: 'always',
        },
      ],
      '@stylistic/space-in-parens': 'warn',
      '@stylistic/space-infix-ops': 'warn',
      '@stylistic/space-unary-ops': 'warn',
      '@stylistic/type-annotation-spacing': [
        'warn',
        {
          before: false,
          after: true,
        },
      ],
    },
  },

  {
    ...pluginVitest.configs.recommended,
    files: ['src/**/__tests__/*'],
  },

  ...pluginOxlint.buildFromOxlintConfigFile('.oxlintrc.json')
);
