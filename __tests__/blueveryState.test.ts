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
              peripherals: new Map(),
              scanning: false,
              permissionGranted: true,
            },
          });
          expect(blueveryState.getState().permissionGranted).toBe(true);
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
  describe('setPeripheralToState', () => {
    test('should set Peripheral', () => {
      const dummyPeripheralInfo: PeripheralInfo = {
        id: '1',
        rssi: 1,
        advertising: {},
        name: 'testPeripheral1',
      };
      blueveryState.setPeripheralToState(dummyPeripheralInfo);
      expect(Reflect.get(blueveryState.getState().peripherals, '1')).toEqual(
        dummyPeripheralInfo,
      );
    });
    test.todo(
      `Refactor: don't need to Reflect, change the implementation. ref:https://github.com/cerebral/overmind/issues/419`,
    );
  });
});
