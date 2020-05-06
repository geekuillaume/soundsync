module.exports = {
  env: {
    es6: true,
    node: true,
  },
  extends: [
    'airbnb-base',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  plugins: [
    '@typescript-eslint',
  ],
  settings: {
    'import/resolver': {
      node: { extensions: ['.js', '.ts'] }
    }
  },
  rules: {
    "import/prefer-default-export": 0,
    "no-underscore-dangle": 0,
    "quotes": ['error', 'single', {"allowTemplateLiterals": true}],
    "lines-between-class-members": 0,
    "@typescript-eslint/no-unused-vars": ['error'],
    "@typescript-eslint/no-explicit-any": 0,
    "@typescript-eslint/explicit-function-return-type": 0,
    "@typescript-eslint/no-empty-function": 0,
    "class-methods-use-this": 0,
    "@typescript-eslint/ban-ts-ignore": 0,
    "max-classes-per-file": 0,
    "no-unused-vars": 0,
    "import/extensions": 0,
    "max-len": 0,
    "import/no-unresolved": 0,
    "import/no-extraneous-dependencies": 0,
    "no-param-reassign": 0,
    "no-plusplus": 0,
    "no-empty": ["error", { "allowEmptyCatch": true }],
    "no-constant-condition": 0,
    "prefer-destructuring": 0,
    "spaced-comment": 0,
    "no-useless-constructor": 0,
    "no-return-await": 0,
    "no-new": 0,
    "no-restricted-syntax": 0,
  },
};
