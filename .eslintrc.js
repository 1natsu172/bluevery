module.exports = {
  root: true,
  extends: [
    'plugin:prettier/recommended',
    '@react-native-community',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  rules: {
    'no-unsafe-finally': 'error',
    'require-await': 'error'
  },
};
