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
    getConnectedPeripherals: jest.fn(async () => [
      {
        id: 'connected1',
        rssi: 1,
        name: 'connectedTester1',
        advertising: {},
      },
      {
        id: 'connected2',
        rssi: 2,
        name: 'connectedTester2',
        advertising: {},
      },
      {
        id: 'connected3',
        rssi: 3,
        name: 'connectedTester3',
        advertising: {},
      },
    ]),
    getBondedPeripherals: jest.fn(async () => [
      {
        id: 'bonded1',
        rssi: 1,
        name: 'bondedTester1',
        advertising: {},
      },
      {
        id: 'bonded2',
        rssi: 2,
        name: 'bondedTester2',
        advertising: {},
      },
      {
        id: 'bonded3',
        rssi: 3,
        name: 'bondedTester3',
        advertising: {},
      },
    ]),
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
    startNotification: jest.fn(),
    stopNotification: jest.fn(),
    isPeripheralConnected: jest.fn(() => false),
  };
});
