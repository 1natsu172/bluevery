import {BlueveryState} from '../src/blueveryState';
import {PeripheralInfo, State} from '../src/interface';

/**
 * prepare instances & spiedMethods
 */
let blueveryState: BlueveryState;
beforeEach(() => {
  // cleanup mocks
  jest.clearAllMocks();
  // cleanup spys
  jest.restoreAllMocks();

  blueveryState = new BlueveryState({});
});

describe('BlueveryState', () => {
  describe('constructor', () => {
    describe('argments', () => {
      describe('initialState', () => {
        test('should inject initialState', () => {
          blueveryState = new BlueveryState({
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
          blueveryState = new BlueveryState({onChangeStateHandler});
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
    const dummyPeripheralInfo: PeripheralInfo = {
      id: '1',
      rssi: 1,
      advertising: {},
      name: 'testPeripheral1',
    };
    beforeEach(() => {
      blueveryState.setPeripheralInfoToManagingPeripherals(
        dummyPeripheralInfo.id,
        dummyPeripheralInfo,
      );
    });
    describe('managingPeripheral:connect', () => {
      describe('setManagingPeripheralConnecting', () => {
        test('should change to on connecting of the State', () => {
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
        test('should change to off connecting of the State', () => {
          expect(
            blueveryState.getState().managingPeripherals['1'].connect,
          ).toBeUndefined();
          blueveryState.setManagingPeripheralConnecting(dummyPeripheralInfo.id);
          expect(
            blueveryState.getState().managingPeripherals['1'].connect,
          ).toBe('connecting');
        });
      });
      describe('setManagingPeripheralDisconnected', () => {
        test('should change to off connecting of the State', () => {
          expect(
            blueveryState.getState().managingPeripherals['1'].connect,
          ).toBeUndefined();
          blueveryState.setManagingPeripheralConnecting(dummyPeripheralInfo.id);
          expect(
            blueveryState.getState().managingPeripherals['1'].connect,
          ).toBe('connecting');
        });
      });
      describe('setManagingPeripheralFailedConnect', () => {
        test('should change to off connecting of the State', () => {
          expect(
            blueveryState.getState().managingPeripherals['1'].connect,
          ).toBeUndefined();
          blueveryState.setManagingPeripheralConnecting(dummyPeripheralInfo.id);
          expect(
            blueveryState.getState().managingPeripherals['1'].connect,
          ).toBe('connecting');
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
        blueveryState.setPeripheralToManagingPeripherals(dummyPeripheralInfo);
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
        blueveryState.setPeripheralToManagingPeripherals(dummyPeripheralInfo);
        expect(
          blueveryState.getState().managingPeripherals['1'],
        ).toHaveProperty('bonded', undefined);
        blueveryState.setPeripheralIsBonded(dummyPeripheralInfo.id);
        expect(
          blueveryState.getState().managingPeripherals['1'],
        ).toHaveProperty('bonded', true);
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
      const dummyPeripheralInfo: PeripheralInfo = {
        id: '1',
        rssi: 1,
        advertising: {},
        name: 'testPeripheral1',
      };
      blueveryState.setPeripheralToScannedPeripherals(dummyPeripheralInfo);
      expect(blueveryState.getState().scannedPeripherals['1']).toEqual(
        dummyPeripheralInfo,
      );
    });
  });
  describe('clearScannedPeripherals', () => {
    test('should clear current Peripherals', () => {
      const dummyPeripheralInfo: PeripheralInfo = {
        id: '1',
        rssi: 1,
        advertising: {},
        name: 'testPeripheral1',
      };
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
  describe('setPeripheralToManagingPeripherals', () => {
    test('should set peripheral to managingPeripherals', () => {
      const dummyPeripheralInfo: PeripheralInfo = {
        id: '1',
        rssi: 1,
        advertising: {},
        name: 'testConnectedPeripheral1',
      };
      blueveryState.setPeripheralToManagingPeripherals(dummyPeripheralInfo);
      expect(blueveryState.getState().managingPeripherals['1']).toEqual(
        dummyPeripheralInfo,
      );
    });
  });
  describe('deletePeripheralFromManagingPeripherals', () => {
    test('should delete peripheral from conectedPeripherals', () => {
      const dummyPeripheralInfo: PeripheralInfo = {
        id: '1',
        rssi: 1,
        advertising: {},
        name: 'testWillDisconnectPeripheral1',
      };
      blueveryState.setPeripheralToManagingPeripherals(dummyPeripheralInfo);
      expect(blueveryState.getState().managingPeripherals).toHaveProperty('1');
      blueveryState.deletePeripheralFromManagingPeripherals(
        dummyPeripheralInfo.id,
      );
      expect(blueveryState.getState().managingPeripherals).not.toHaveProperty(
        '1',
      );
    });
  });
});
