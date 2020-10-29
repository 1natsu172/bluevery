jest.mock(
  './node_modules/react-native/Libraries/EventEmitter/NativeEventEmitter',
);
jest.mock('react-native-permissions', () => {
  const mock = require('react-native-permissions/mock');
  return mock;
});
