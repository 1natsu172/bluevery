/**
 * Metro configuration for React Native
 * https://github.com/facebook/react-native
 *
 * @format
 */
const path = require('path');
const blacklist = require('metro-config/src/defaults/blacklist');
const escape = require('escape-string-regexp');
const parentPak = require('../package.json');

const rootPath = path.resolve(__dirname, '..');
const modules = ['@babel/runtime', ...Object.keys(parentPak.peerDependencies)];

module.exports = {
  projectRoot: __dirname,
  watchFolders: [rootPath],
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: false,
      },
    }),
  },
  resolver: {
    blacklistRE: blacklist(
      modules.map(
        (module) =>
          new RegExp(
            `^${escape(path.join(rootPath, 'node_modules', module))}\\/.*$`,
          ),
      ),
    ),

    extraNodeModules: modules.reduce((acc, module) => {
      acc[module] = path.join(__dirname, 'node_modules', module);
      return acc;
    }, {}),
  },
};
