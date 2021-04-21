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
    getConnectedPeripherals: jest.fn(async () => []),
    getBondedPeripherals: jest.fn(async () => []),
    read: jest.fn(async () => [[1], [2], [3]]),
    write: jest.fn(async () => [[1], [2], [3]]),
    checkState: jest.fn(() => {
      const NativeEventEmitter = require('react-native').NativeEventEmitter;
      const nativeEventEmitter = new NativeEventEmitter();
      nativeEventEmitter.emit('BleManagerDidUpdateState', {
        state: 'on',
      });
    }),
    connect: jest.fn(),
    retrieveServices: jest.fn(),
    createBond: jest.fn(),
  };
});
