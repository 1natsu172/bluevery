module.exports = {
  setupFilesAfterEnv: ['jest-extended'],
  preset: 'react-native',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  setupFiles: ['<rootDir>/jest.setup.js'],
  testPathIgnorePatterns: ['<rootDir>/example'],
  modulePathIgnorePatterns: ['<rootDir>/__tests__/__utils__'],
  transformIgnorePatterns: [], // ESM対策(なんで動くのかわからん)
};
