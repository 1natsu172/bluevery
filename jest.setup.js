/* eslint-disable no-undef */
jest.mock(
  './node_modules/react-native/Libraries/EventEmitter/NativeEventEmitter',
);
jest.mock('react-native-permissions', () => {
  const mock = require('react-native-permissions/mock');
  return mock;
});
jest.mock('react-native-ble-manager', () => {
  return {
    start: jest.fn(async () => {}),
    scan: jest.fn(async () => {}),
    stopScan: jest.fn(async () => {}),
  };
});
