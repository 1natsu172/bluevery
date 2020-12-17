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
              connecting: false,
              error: undefined,
              managing: false,
              peripherals: {},
              scanning: false,
              permissionGranted: {
                is: 'ungranted',
                lack: ['ios.permission.BLUETOOTH_PERIPHERAL'],
              },
              characteristicValues: [],
              checkingCommunicateWithPeripheral: false,
              receivingForCharacteristicValue: false,
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

  describe('emitState', () => {
    let currentState;
    beforeEach(() => {
      currentState = undefined;
      blueveryState.stateEmitter.on((state) => {
        currentState = state;
      });
    });
    afterEach(() => {
      blueveryState.stateEmitter.offAll();
    });
    test('should emit state', () => {
      expect(currentState).not.toEqual(expect.any(Object));
      blueveryState.emitState();
      expect(currentState).toEqual(expect.any(Object));
    });
    test('should support after the changed state', () => {
      blueveryState.onScanning();
      blueveryState.emitState();
      expect(currentState).toEqual(
        expect.objectContaining<Partial<State>>({scanning: true}),
      );
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
  describe('onConnecting', () => {
    test('should change to on connecting of the State', () => {
      expect(blueveryState.getState().connecting).toBe(false);
      blueveryState.onConnecting();
      expect(blueveryState.getState().connecting).toBe(true);
    });
  });
  describe('offConnecting', () => {
    test('should change to off connecting of the State', () => {
      blueveryState.onConnecting();
      expect(blueveryState.getState().connecting).toBe(true);
      blueveryState.offConnecting();
      expect(blueveryState.getState().connecting).toBe(false);
    });
  });
  describe('onReceivingForCharacteristicValue', () => {
    test('should change to on receivingForCharacteristicValue of the State', () => {
      expect(blueveryState.getState().receivingForCharacteristicValue).toBe(
        false,
      );
      blueveryState.onReceivingForCharacteristicValue();
      expect(blueveryState.getState().receivingForCharacteristicValue).toBe(
        true,
      );
    });
  });
  describe('offReceivingForCharacteristicValue', () => {
    test('should change to off receivingForCharacteristicValue of the State', () => {
      blueveryState.onReceivingForCharacteristicValue();
      expect(blueveryState.getState().receivingForCharacteristicValue).toBe(
        true,
      );
      blueveryState.offReceivingForCharacteristicValue();
      expect(blueveryState.getState().receivingForCharacteristicValue).toBe(
        false,
      );
    });
  });
  describe('onCheckingCommunicateWithPeripheral', () => {
    test('should change to on checkingCommunicateWithPeripheral of the State', () => {
      expect(blueveryState.getState().checkingCommunicateWithPeripheral).toBe(
        false,
      );
      blueveryState.onCheckingCommunicateWithPeripheral();
      expect(blueveryState.getState().checkingCommunicateWithPeripheral).toBe(
        true,
      );
    });
  });
  describe('offCheckingCommunicateWithPeripheral', () => {
    test('should change to off checkingCommunicateWithPeripheral of the State', () => {
      blueveryState.onCheckingCommunicateWithPeripheral();
      expect(blueveryState.getState().checkingCommunicateWithPeripheral).toBe(
        true,
      );
      blueveryState.offCheckingCommunicateWithPeripheral();
      expect(blueveryState.getState().checkingCommunicateWithPeripheral).toBe(
        false,
      );
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
  describe('setPeripheralToState', () => {
    test('should set Peripheral', () => {
      const dummyPeripheralInfo: PeripheralInfo = {
        id: '1',
        rssi: 1,
        advertising: {},
        name: 'testPeripheral1',
      };
      blueveryState.setPeripheralToState(dummyPeripheralInfo);
      expect(blueveryState.getState().peripherals['1']).toEqual(
        dummyPeripheralInfo,
      );
    });
  });
  describe('setCharacteristicValues', () => {
    test('should set Peripheral', () => {
      blueveryState.setCharacteristicValues([1, 2, 3]);
      expect(blueveryState.getState().characteristicValues[0]).toEqual([
        1,
        2,
        3,
      ]);
    });
    test('should set order by push', () => {
      const values = [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
      ];
      values.forEach((value) => blueveryState.setCharacteristicValues(value));
      blueveryState.getState().characteristicValues.forEach((value, i) => {
        expect(value).toEqual(values[i]);
      });
    });
  });
});
