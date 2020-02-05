module.exports = {
  env: {
    es6: true,
    node: true,
  },
  extends: [
    'airbnb-base',
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
    "no-unused-vars": 0,
    "import/extensions": 0,
  },
};
