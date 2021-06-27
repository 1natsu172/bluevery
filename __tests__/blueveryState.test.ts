import {proxy} from 'valtio';
import {BlueveryState, createInitialState} from '../src/blueveryState';
import {PeripheralInfo, State} from '../src/interface';

/**
 * prepare instances & spiedMethods
 */
let blueveryState: BlueveryState;
const dummyPeripheralInfo: PeripheralInfo = {
  id: '1',
  rssi: 1,
  advertising: {},
  name: 'testPeripheral1',
};
beforeEach(() => {
  // cleanup mocks
  jest.clearAllMocks();
  // cleanup spys
  jest.restoreAllMocks();

  blueveryState = new BlueveryState({
    store: proxy({bluevery: createInitialState()}),
  });
});

describe('BlueveryState', () => {
  describe('constructor', () => {
    describe('argments', () => {
      describe('initialState', () => {
        test('should inject initialState', () => {
          blueveryState = new BlueveryState({
            store: proxy({bluevery: createInitialState()}),

            initialState: {
              bluetoothEnabled: false,
              error: undefined,
              managing: false,
              managingPeripherals: {},
              scannedPeripherals: {},
              scanning: false,
              permissionGranted: {
                is: 'ungranted',
                lack: ['ios.permission.BLUETOOTH_PERIPHERAL'],
              },
            },
          });
          expect(blueveryState.getState().permissionGranted).toEqual({
            is: 'ungranted',
            lack: ['ios.permission.BLUETOOTH_PERIPHERAL'],
          });
        });
      });
      describe('onChangeStateHandler', () => {
        test('should call onChangeHandler when onChangeState', () => {
          const onChangeStateHandler = jest.fn();
          blueveryState = new BlueveryState({
            store: proxy({bluevery: createInitialState()}),
            onChangeStateHandler,
          });
          expect(onChangeStateHandler).not.toBeCalled();
          blueveryState.onScanning();
          expect(onChangeStateHandler).toBeCalled();
        });
      });
    });
  });

  describe('getState', () => {
    test('should get state', () => {
      expect(blueveryState.getState()).toEqual(expect.any(Object));
    });
    test('should get current state', () => {
      blueveryState.onScanning();
      expect(blueveryState.getState()).toEqual(
        expect.objectContaining<Partial<State>>({scanning: true}),
      );
    });
  });

  describe('resetState', () => {
    test('should be reset to the initial state. ', () => {
      const initState = blueveryState.getState();
      blueveryState.onScanning();
      const mutatedState = blueveryState.getState();

      expect(initState).not.toEqual(mutatedState);

      blueveryState.resetState();

      const resetedState = blueveryState.getState();

      expect(initState).toEqual(resetedState);
    });
  });

  describe('reInitState', () => {
    test('should be reInit to the current state', () => {
      const firstInitState = blueveryState.getState();

      const willReInitedState = {...firstInitState, bluetoothEnabled: true};
      blueveryState.reInitState(willReInitedState);

      const reInitedState = blueveryState.getState();

      expect(reInitedState).not.toEqual(firstInitState);
      expect(reInitedState).toEqual(willReInitedState);
    });
  });

  describe('onManaging', () => {
    test('should change to on managing of the State', () => {
      expect(blueveryState.getState().managing).toBe(false);
      blueveryState.onManaging();
      expect(blueveryState.getState().managing).toBe(true);
    });
  });
  describe('offManaging', () => {
    test('should change to off managing of the State', () => {
      blueveryState.onManaging();
      expect(blueveryState.getState().managing).toBe(true);
      blueveryState.offManaging();
      expect(blueveryState.getState().managing).toBe(false);
    });
  });
  describe('setBluetoothEnabled', () => {
    test('should change to truthy(enabled) bluetoothEnabled of the State', () => {
      expect(blueveryState.getState().bluetoothEnabled).toBe(false);
      blueveryState.setBluetoothEnabled();
      expect(blueveryState.getState().bluetoothEnabled).toBe(true);
    });
  });
  describe('setBluetoothDisabled', () => {
    test('should change to falsy(disabled) bluetoothEnabled of the State', () => {
      blueveryState.setBluetoothEnabled();
      expect(blueveryState.getState().bluetoothEnabled).toBe(true);
      blueveryState.setBluetoothDisabled();
      expect(blueveryState.getState().bluetoothEnabled).toBe(false);
    });
  });
  describe('onScanning', () => {
    test('should change to on scanning of the State', () => {
      expect(blueveryState.getState().scanning).toBe(false);
      blueveryState.onScanning();
      expect(blueveryState.getState().scanning).toBe(true);
    });
  });
  describe('offScanning', () => {
    test('should change to off scanning of the State', () => {
      blueveryState.onScanning();
      expect(blueveryState.getState().scanning).toBe(true);
      blueveryState.offScanning();
      expect(blueveryState.getState().scanning).toBe(false);
    });
  });
  describe('managingPeripheral', () => {
    beforeEach(() => {
      // Set dummy PeripheralInfo to ManagingPeripherals
      blueveryState.setPeripheralInfoToManagingPeripherals(
        dummyPeripheralInfo.id,
        dummyPeripheralInfo,
      );
    });
    describe('setPeripheralToManagingPeripherals', () => {
      test('should set peripheral to managingPeripherals', () => {
        blueveryState.setPeripheralToManagingPeripherals(dummyPeripheralInfo);
        expect(blueveryState.getState().managingPeripherals['1']).toEqual(
          dummyPeripheralInfo,
        );
      });
      test('should be overwrite existed PeripheralInfo', () => {
        const newPeripheralInfo: PeripheralInfo = {
          ...dummyPeripheralInfo,
          name: 'newTestPeripheral1',
        };
        blueveryState.setPeripheralToManagingPeripherals(newPeripheralInfo);
        expect(blueveryState.getState().managingPeripherals['1'].name).toBe(
          'newTestPeripheral1',
        );
      });
    });
    describe('deletePeripheralFromManagingPeripherals', () => {
      test('should delete peripheral from conectedPeripherals', () => {
        expect(blueveryState.getState().managingPeripherals).toHaveProperty(
          '1',
        );
        blueveryState.deletePeripheralFromManagingPeripherals(
          dummyPeripheralInfo.id,
        );
        expect(blueveryState.getState().managingPeripherals).not.toHaveProperty(
          '1',
        );
      });
    });
    describe('managingPeripheral:connect', () => {
      test('should be throw when target peripheral property does not exist', () => {
        expect(() =>
          blueveryState.setManagingPeripheralConnecting('2'),
        ).toThrowError('2 is not found in managingPeripherals');
      });

      describe('setManagingPeripheralConnecting', () => {
        test('should change to connecting of the State', () => {
          expect(
            blueveryState.getState().managingPeripherals['1'].connect,
          ).toBeUndefined();
          blueveryState.setManagingPeripheralConnecting(dummyPeripheralInfo.id);
          expect(
            blueveryState.getState().managingPeripherals['1'].connect,
          ).toBe('connecting');
        });
      });
      describe('setManagingPeripheralConnected', () => {
        test('should change to connected of the State', () => {
          expect(
            blueveryState.getState().managingPeripherals['1'].connect,
          ).toBeUndefined();
          blueveryState.setManagingPeripheralConnected(dummyPeripheralInfo.id);
          expect(
            blueveryState.getState().managingPeripherals['1'].connect,
          ).toBe('connected');
        });
      });
      describe('setManagingPeripheralDisconnected', () => {
        test('should change to disconnected of the State', () => {
          expect(
            blueveryState.getState().managingPeripherals['1'].connect,
          ).toBeUndefined();
          blueveryState.setManagingPeripheralDisconnected(
            dummyPeripheralInfo.id,
          );
          expect(
            blueveryState.getState().managingPeripherals['1'].connect,
          ).toBe('disconnected');
        });
      });
      describe('setManagingPeripheralFailedConnect', () => {
        test('should change to failed of the State', () => {
          expect(
            blueveryState.getState().managingPeripherals['1'].connect,
          ).toBeUndefined();
          blueveryState.setManagingPeripheralFailedConnect(
            dummyPeripheralInfo.id,
          );
          expect(
            blueveryState.getState().managingPeripherals['1'].connect,
          ).toBe('failed');
        });
      });
    });
    describe('managingPeripheral:retrieveServices', () => {
      describe('setManagingPeripheralRetrieving', () => {
        test('should change to connecting of the State', () => {
          expect(
            blueveryState.getState().managingPeripherals['1'].retrieveServices,
          ).toBeUndefined();
          blueveryState.setManagingPeripheralRetrieving(dummyPeripheralInfo.id);
          expect(
            blueveryState.getState().managingPeripherals['1'].retrieveServices,
          ).toBe('retrieving');
        });
      });
      describe('setManagingPeripheralRetrieved', () => {
        test('should change to connecting of the State', () => {
          expect(
            blueveryState.getState().managingPeripherals['1'].retrieveServices,
          ).toBeUndefined();
          blueveryState.setManagingPeripheralRetrieved(dummyPeripheralInfo.id);
          expect(
            blueveryState.getState().managingPeripherals['1'].retrieveServices,
          ).toBe('retrieved');
        });
      });
      describe('setManagingPeripheralRetrieveFailed', () => {
        test('should change to connecting of the State', () => {
          expect(
            blueveryState.getState().managingPeripherals['1'].retrieveServices,
          ).toBeUndefined();
          blueveryState.setManagingPeripheralRetrieveFailed(
            dummyPeripheralInfo.id,
          );
          expect(
            blueveryState.getState().managingPeripherals['1'].retrieveServices,
          ).toBe('failed');
        });
      });
    });

    describe('managingPeripheral:receivingForCharacteristicValue', () => {
      describe('onReceivingForCharacteristicValue', () => {
        test('should change to on receivingForCharacteristicValue of the State', () => {
          expect(
            blueveryState.getState().managingPeripherals['1']
              .receivingForCharacteristicValue,
          ).toBeUndefined();
          blueveryState.onReceivingForCharacteristicValue(
            dummyPeripheralInfo.id,
          );
          expect(
            blueveryState.getState().managingPeripherals['1']
              .receivingForCharacteristicValue,
          ).toBe(true);
        });
      });
      describe('offReceivingForCharacteristicValue', () => {
        test('should change to off receivingForCharacteristicValue of the State', () => {
          expect(
            blueveryState.getState().managingPeripherals['1']
              .receivingForCharacteristicValue,
          ).toBeUndefined();
          blueveryState.offReceivingForCharacteristicValue(
            dummyPeripheralInfo.id,
          );
          expect(
            blueveryState.getState().managingPeripherals['1']
              .receivingForCharacteristicValue,
          ).toBe(false);
        });
      });
    });

    describe('managingPeripherals:bonded', () => {
      test('should set bonded property to peripheralInfo ', () => {
        expect(
          blueveryState.getState().managingPeripherals['1'],
        ).toHaveProperty('bonded', undefined);
        blueveryState.setPeripheralIsBonded(dummyPeripheralInfo.id);
        expect(
          blueveryState.getState().managingPeripherals['1'],
        ).toHaveProperty('bonded', true);
      });
    });

    describe('managingPeripherals:receivingForCharacteristicValueListener', () => {
      test('should set bonded property to peripheralInfo ', () => {
        expect(
          blueveryState.getState().managingPeripherals['1'],
        ).toHaveProperty('bonded', undefined);
        blueveryState.setPeripheralIsBonded(dummyPeripheralInfo.id);
        expect(
          blueveryState.getState().managingPeripherals['1'],
        ).toHaveProperty('bonded', true);
      });
    });

    describe('managingPeripherals:communicate', () => {
      test('should set reading the communicate property to peripheralInfo ', () => {
        expect(
          blueveryState.getState().managingPeripherals['1'],
        ).toHaveProperty('communicate', undefined);
        blueveryState.setPeripheralCommunicateIsReading(dummyPeripheralInfo.id);
        expect(
          blueveryState.getState().managingPeripherals['1'],
        ).toHaveProperty('communicate', 'reading');
      });
      test('should set writing the communicate property to peripheralInfo ', () => {
        expect(
          blueveryState.getState().managingPeripherals['1'],
        ).toHaveProperty('communicate', undefined);
        blueveryState.setPeripheralCommunicateIsWriting(dummyPeripheralInfo.id);
        expect(
          blueveryState.getState().managingPeripherals['1'],
        ).toHaveProperty('communicate', 'writing');
      });
      test('should set nonCommnicate the communicate property to peripheralInfo ', () => {
        expect(
          blueveryState.getState().managingPeripherals['1'],
        ).toHaveProperty('communicate', undefined);
        blueveryState.setPeripheralCommunicateIsNon(dummyPeripheralInfo.id);
        expect(
          blueveryState.getState().managingPeripherals['1'],
        ).toHaveProperty('communicate', 'nonCommunicate');
      });
    });
  });

  describe('setPermissionGranted', () => {
    test('should change to truthy(granted) permissionGranted of the State', () => {
      expect(blueveryState.getState().permissionGranted).toEqual({
        is: 'unknown',
        lack: [],
      });
      blueveryState.setPermissionGranted();
      expect(blueveryState.getState().permissionGranted).toEqual({
        is: 'granted',
        lack: [],
      });
    });
  });
  describe('setPermissionUnGranted', () => {
    test('should change to falsy(ungranted) permissionGranted of the State', () => {
      blueveryState.setPermissionGranted();
      expect(blueveryState.getState().permissionGranted).toEqual({
        is: 'granted',
        lack: [],
      });
      blueveryState.setPermissionUnGranted([
        'ios.permission.BLUETOOTH_PERIPHERAL',
      ]);
      expect(blueveryState.getState().permissionGranted).toEqual({
        is: 'ungranted',
        lack: ['ios.permission.BLUETOOTH_PERIPHERAL'],
      });
    });
  });
  describe('setPeripheralToScannedPeripherals', () => {
    test('should set Peripheral', () => {
      blueveryState.setPeripheralToScannedPeripherals(dummyPeripheralInfo);
      expect(blueveryState.getState().scannedPeripherals['1']).toEqual(
        dummyPeripheralInfo,
      );
    });
    test('should does not set Peripheral if already exist the peripheral in scannedPeripherals', () => {
      const willSamePeripheral: PeripheralInfo = {
        ...dummyPeripheralInfo,
        rssi: 10000,
      };

      blueveryState.setPeripheralToScannedPeripherals(dummyPeripheralInfo);
      expect(blueveryState.getState().scannedPeripherals['1'].rssi).toBe(1);

      blueveryState.setPeripheralToScannedPeripherals(willSamePeripheral);
      expect(blueveryState.getState().scannedPeripherals['1'].rssi).toBe(1);
    });
  });
  describe('clearScannedPeripherals', () => {
    test('should clear current Peripherals', () => {
      blueveryState.setPeripheralToScannedPeripherals(dummyPeripheralInfo);
      expect(
        Object.values(blueveryState.getState().scannedPeripherals),
      ).toHaveLength(1);
      blueveryState.clearScannedPeripherals();
      expect(
        Object.values(blueveryState.getState().scannedPeripherals),
      ).toHaveLength(0);
    });
  });
});
