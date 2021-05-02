import {BlueveryCore} from '../src/blueveryCore';
import {BlueveryState, createInitialState} from '../src/blueveryState';
import {BlueveryListeners} from '../src/blueveryListeners';
import {
  checkBluetoothEnabled,
  checkPermission,
  requestPermission,
} from '../src/libs';
import {flushPromisesAdvanceTimer} from './__utils__/flushPromisesAdvanceTimer';
import {dummyPeripheralInfo} from './__utils__/dummyPeripheralInfo';
import BleManager from 'react-native-ble-manager';
import {EmitterSubscription} from 'react-native';

jest.mock('../src/libs', () => ({
  __esModule: true,
  ...jest.requireActual('../src/libs'),
  // mocking only some of the following libs as they use NativeModules
  checkBluetoothEnabled: jest.fn(async () => true),
  checkPermission: jest.fn(),
  requestPermission: jest.fn(),
}));

/**
 * prepare instances & spiedMethods
 */
let blueveryCore: BlueveryCore;

let spiedCheckAndRequestPermission: jest.SpyInstance;
let spiedCheckBluetoothEnabled: jest.SpyInstance;
let spiedRequireCheckBeforeBleProcess: jest.SpyInstance;
let spiedCheckThePeripheralIsManaging: jest.SpyInstance;
let spiedCleanupScan: jest.SpyInstance;
let spiedClearScannedPeripherals: jest.SpyInstance;
beforeEach(() => {
  // cleanup mocks
  jest.clearAllMocks();
  // cleanup spys
  jest.restoreAllMocks();

  // note: methods spying
  spiedCheckAndRequestPermission = jest
    // @ts-ignore
    .spyOn(BlueveryCore.prototype, 'checkAndRequestPermission')
    // @ts-ignore
    .mockImplementation(async () => []);
  spiedCheckBluetoothEnabled = jest
    // @ts-ignore
    .spyOn(BlueveryCore.prototype, 'checkBluetoothEnabled')
    // @ts-ignore
    .mockImplementation(async () => true);
  spiedRequireCheckBeforeBleProcess = jest
    // @ts-ignore
    .spyOn(BlueveryCore.prototype, 'requireCheckBeforeBleProcess')
    // @ts-ignore
    .mockImplementation(async () => true);
  // note: The lack of mockimplementation is intentional.
  spiedCleanupScan = jest
    // @ts-ignore
    .spyOn(BlueveryCore.prototype, 'cleanupScan');
  spiedClearScannedPeripherals = jest
    // @ts-ignore
    .spyOn(BlueveryCore.prototype, 'clearScannedPeripherals');
  spiedCheckThePeripheralIsManaging = jest.spyOn(
    BlueveryCore.prototype,
    // @ts-expect-error
    'checkThePeripheralIsManaging',
  );

  // note: need create instance after spyOn
  blueveryCore = new BlueveryCore({
    BlueveryState,
    blueveryListeners: new BlueveryListeners(),
  });
});

describe('BlueveryCore', () => {
  describe('init', () => {
    test('should set userDefinedOptions', () => {
      const opts = {onDisconnectPeripheralHandler: jest.fn()};
      blueveryCore.init(opts);
      // @ts-expect-error
      expect(blueveryCore.userDefinedOptions).toEqual(opts);
    });
  });

  describe('checkAndRequestPermission', () => {
    const mockedCheckPermission = checkPermission as jest.MockedFunction<
      typeof checkPermission
    >;
    const mockedRequestPermission = requestPermission as jest.MockedFunction<
      typeof requestPermission
    >;
    describe('record to state the permissionGranted', () => {
      test('should record `requestedButUngranted`', async () => {
        mockedCheckPermission.mockImplementationOnce(async () => [
          [],
          ['ios.permission.BLUETOOTH_PERIPHERAL'],
        ]);
        mockedRequestPermission.mockImplementationOnce(async () => [
          [],
          ['ios.permission.BLUETOOTH_PERIPHERAL'],
        ]);

        // unSpy checkAndRequestPermission because want to test with substance method
        spiedCheckAndRequestPermission.mockRestore();
        blueveryCore = new BlueveryCore({
          BlueveryState,
          blueveryListeners: new BlueveryListeners(),
        });

        // @ts-ignore ts(2341) access to private
        expect(blueveryCore.getState().permissionGranted).toEqual({
          is: 'unknown',
          lack: [],
        });
        // @ts-ignore ts(2341) access to private
        await blueveryCore.checkAndRequestPermission();
        // @ts-ignore ts(2341) access to private
        expect(blueveryCore.getState().permissionGranted).toEqual({
          is: 'ungranted',
          lack: ['ios.permission.BLUETOOTH_PERIPHERAL'],
        });
      });
      describe('record `permissionGranted` pattern', () => {
        test('should record `granted` when 1st check has granted', async () => {
          mockedCheckPermission.mockImplementationOnce(async () => [
            ['ios.permission.BLUETOOTH_PERIPHERAL'],
            [],
          ]);

          // unSpy checkAndRequestPermission because want to test with substance method
          spiedCheckAndRequestPermission.mockRestore();
          blueveryCore = new BlueveryCore({
            BlueveryState,
            blueveryListeners: new BlueveryListeners(),
          });

          // @ts-ignore ts(2341) access to private
          expect(blueveryCore.getState().permissionGranted).toEqual({
            is: 'unknown',
            lack: [],
          });
          // @ts-ignore ts(2341) access to private
          await blueveryCore.checkAndRequestPermission();
          // @ts-ignore ts(2341) access to private
          expect(blueveryCore.getState().permissionGranted).toEqual({
            is: 'granted',
            lack: [],
          });
        });
        test('should record `granted` when 1st check has ungranted then granted by 2nd requested', async () => {
          mockedCheckPermission.mockImplementationOnce(async () => [
            [],
            ['ios.permission.BLUETOOTH_PERIPHERAL'],
          ]);
          mockedRequestPermission.mockImplementationOnce(async () => [[], []]);

          // unSpy checkAndRequestPermission because want to test with substance method
          spiedCheckAndRequestPermission.mockRestore();
          blueveryCore = new BlueveryCore({
            BlueveryState,
            blueveryListeners: new BlueveryListeners(),
          });

          // @ts-ignore ts(2341) access to private
          expect(blueveryCore.getState().permissionGranted).toEqual({
            is: 'unknown',
            lack: [],
          });
          // @ts-ignore ts(2341) access to private
          await blueveryCore.checkAndRequestPermission();
          // @ts-ignore ts(2341) access to private
          expect(blueveryCore.getState().permissionGranted).toEqual({
            is: 'granted',
            lack: [],
          });
        });
      });
    });
  });
  describe('requireCheckBeforeBleProcess', () => {
    test('should be managing', async () => {
      // unSpy requireCheckBeforeBleProcess because want to test with substance method
      spiedRequireCheckBeforeBleProcess.mockRestore();
      blueveryCore = new BlueveryCore({
        BlueveryState,
        blueveryListeners: new BlueveryListeners(),
      });

      // @ts-ignore ts(2341) access to private
      expect(blueveryCore.getState().managing).toBe(false);
      // @ts-ignore ts(2341) access to private
      await blueveryCore.requireCheckBeforeBleProcess();
      // @ts-ignore ts(2341) access to private
      expect(blueveryCore.getState().managing).toBe(true);
    });
    describe('unpassed(false) pattern', () => {
      test('should return false if permission requestedButUngranted', async () => {
        spiedCheckAndRequestPermission.mockResolvedValueOnce([
          [],
          [],
          ['ios.permission.BLUETOOTH_PERIPHERAL'],
        ]);
        // unSpy requireCheckBeforeBleProcess because want to test with substance method
        spiedRequireCheckBeforeBleProcess.mockRestore();
        blueveryCore = new BlueveryCore({
          BlueveryState,
          blueveryListeners: new BlueveryListeners(),
        });

        // @ts-ignore ts(2341) access to private
        const ret = await blueveryCore.requireCheckBeforeBleProcess();
        expect(ret).toBe(false);
      });
      test('should return false if is not BluetoothEnabled requestedButUngranted', async () => {
        spiedCheckBluetoothEnabled.mockResolvedValueOnce(false);
        // unSpy requireCheckBeforeBleProcess because want to test with substance method
        spiedRequireCheckBeforeBleProcess.mockRestore();
        blueveryCore = new BlueveryCore({
          BlueveryState,
          blueveryListeners: new BlueveryListeners(),
        });

        // @ts-ignore ts(2341) access to private
        const ret = await blueveryCore.requireCheckBeforeBleProcess();
        expect(ret).toBe(false);
      });
    });
  });

  describe('checkThePeripheralIsManaging', () => {
    beforeEach(() => {
      blueveryCore = new BlueveryCore({
        blueveryListeners: new BlueveryListeners(),
        BlueveryState,
        initialState: createInitialState({
          managingPeripherals: {['1']: dummyPeripheralInfo('1')},
        }),
      });
    });
    test('should not throw if the peripheral is managing', () => {
      expect(() =>
        // @ts-expect-error
        blueveryCore.checkThePeripheralIsManaging('1'),
      ).not.toThrow();
    });
    test('should throw if the peripheral is not managing', () => {
      expect(() =>
        // @ts-expect-error
        blueveryCore.checkThePeripheralIsManaging(
          'maybe not managing peripheral0001',
        ),
      ).toThrow();
    });
  });

  describe('checkBluetoothEnabled', () => {
    const mockedCheckBluetoothEnabled = checkBluetoothEnabled as jest.MockedFunction<
      typeof checkBluetoothEnabled
    >;
    describe('should change state the depend on the result', () => {
      test('the result is enabled', async () => {
        // unSpy
        spiedCheckBluetoothEnabled.mockRestore();
        blueveryCore = new BlueveryCore({
          BlueveryState,
          blueveryListeners: new BlueveryListeners(),
        });

        mockedCheckBluetoothEnabled.mockImplementationOnce(async () => true);
        // @ts-ignore ts(2341) access to private
        await blueveryCore.checkBluetoothEnabled();
        // @ts-ignore ts(2341) access to private
        expect(blueveryCore.getState().bluetoothEnabled).toBe(true);
      });

      test('the result is disabled', async () => {
        // unSpy
        spiedCheckBluetoothEnabled.mockRestore();
        blueveryCore = new BlueveryCore({
          BlueveryState,
          blueveryListeners: new BlueveryListeners(),
        });

        mockedCheckBluetoothEnabled.mockImplementationOnce(async () => false);
        // @ts-ignore ts(2341) access to private
        await blueveryCore.checkBluetoothEnabled();
        // @ts-ignore ts(2341) access to private
        expect(blueveryCore.getState().bluetoothEnabled).toBe(false);
      });
    });
  });

  describe('scan', () => {
    jest.useFakeTimers();

    test('should await the number of seconds of scanning.', async () => {
      const scan1 = blueveryCore.scan({scanningSettings: [[], 1]});
      await flushPromisesAdvanceTimer(1000);
      await scan1;
      expect(scan1).resolves.not.toThrow();
      const scan2 = blueveryCore.scan({scanningSettings: [[], 1]});
      await flushPromisesAdvanceTimer(1000);
      await scan2;
      expect(scan2).resolves.not.toThrow();
    });

    describe('check calls on the processing', () => {
      test('should call requireCheckBeforeBleProcess', async () => {
        blueveryCore.scan({scanningSettings: [[], 1]});
        await flushPromisesAdvanceTimer(1000);
        expect(spiedRequireCheckBeforeBleProcess).toBeCalledTimes(1);
      });

      test('should call cleanupScan at the end of process', async () => {
        blueveryCore.scan({scanningSettings: [[], 1]});
        await flushPromisesAdvanceTimer(1000);
        expect(spiedCleanupScan).toBeCalledTimes(1);
      });

      test('should **not** call clearScannedPeripherals', async () => {
        blueveryCore.scan({scanningSettings: [[], 1]});
        await flushPromisesAdvanceTimer(1000);
        expect(spiedClearScannedPeripherals).not.toBeCalled();
      });
    });
    describe('check guard clause', () => {
      describe('guard from requireCheckBeforeBleProcess', () => {
        test('should guard if return false', async () => {
          spiedRequireCheckBeforeBleProcess.mockResolvedValueOnce(false);
          blueveryCore = new BlueveryCore({
            BlueveryState,
            blueveryListeners: new BlueveryListeners(),
          });
          await flushPromisesAdvanceTimer(1000);
          expect(BleManager.scan).not.toBeCalled();
        });
        test('should not guard return true', async () => {
          spiedRequireCheckBeforeBleProcess.mockResolvedValueOnce(true);
          blueveryCore = new BlueveryCore({
            BlueveryState,
            blueveryListeners: new BlueveryListeners(),
          });
          blueveryCore.scan({scanningSettings: [[], 1]});
          await flushPromisesAdvanceTimer(1000);
          expect(BleManager.scan).toBeCalled();
        });
      });
    });
  });

  describe('writeValue', () => {
    beforeEach(() => {
      blueveryCore = new BlueveryCore({
        blueveryListeners: new BlueveryListeners(),
        BlueveryState,
        initialState: createInitialState({
          managingPeripherals: {['1']: dummyPeripheralInfo('1')},
        }),
      });
    });
    test('should return if value exists', async () => {
      const ret = await blueveryCore.writeValue(
        ['1', 'dummySUUID', 'dummyCharaUUID', 'this is dummy data'],
        {},
      );
      expect(ret).toStrictEqual([[1], [2], [3]]);
    });

    test('should change communicate status', async () => {
      const spyCommunicateStatus = jest.fn();
      blueveryCore = new BlueveryCore({
        blueveryListeners: new BlueveryListeners(),
        BlueveryState,
        initialState: createInitialState({
          managingPeripherals: {['1']: dummyPeripheralInfo('1')},
        }),
        onChangeStateHandler: (state) => {
          spyCommunicateStatus(state.managingPeripherals['1'].communicate);
          // first called
          expect(spyCommunicateStatus.mock.calls[0][0]).toBe('writing');
        },
      });
      // check initial status
      expect(blueveryCore.getState().managingPeripherals['1'].communicate).toBe(
        undefined,
      );
      await blueveryCore.writeValue(
        ['1', 'dummySUUID', 'dummyCharaUUID', 'this is dummy data'],
        {},
      );
      // finally status
      expect(blueveryCore.getState().managingPeripherals['1'].communicate).toBe(
        'nonCommunicate',
      );
    });

    test('writeValue: check calls', async () => {
      await blueveryCore.writeValue(
        ['1', 'dummySUUID', 'dummyCharaUUID', 'this is dummy data'],
        {},
      );
      expect(BleManager.write).toBeCalled();
      expect(spiedRequireCheckBeforeBleProcess).toBeCalled();
      expect(spiedCheckThePeripheralIsManaging).toBeCalled();
    });

    test('writeValue: should throw if error occured', async () => {
      // @ts-expect-error
      BleManager.write.mockImplementationOnce(async () => {
        throw new Error('fixture error');
      });

      const _write = blueveryCore.writeValue(
        ['1', 'dummySUUID', 'dummyCharaUUID', 'this is dummy data'],
        {},
      );
      await expect(_write).rejects.toThrow('fixture error');
    });
  });

  describe('readValue', () => {
    beforeEach(() => {
      blueveryCore = new BlueveryCore({
        blueveryListeners: new BlueveryListeners(),
        BlueveryState,
        initialState: createInitialState({
          managingPeripherals: {['1']: dummyPeripheralInfo('1')},
        }),
      });
    });
    test('should return if value exists', async () => {
      const ret = await blueveryCore.readValue(
        ['1', 'dummySUUID', 'dummyCharaUUID'],
        {},
      );
      expect(ret).toStrictEqual([[1], [2], [3]]);
    });

    test('should change communicate status', async () => {
      const spyCommunicateStatus = jest.fn();
      blueveryCore = new BlueveryCore({
        blueveryListeners: new BlueveryListeners(),
        BlueveryState,
        initialState: createInitialState({
          managingPeripherals: {['1']: dummyPeripheralInfo('1')},
        }),
        onChangeStateHandler: (state) => {
          spyCommunicateStatus(state.managingPeripherals['1'].communicate);
          // first called
          expect(spyCommunicateStatus.mock.calls[0][0]).toBe('reading');
        },
      });
      // check initial status
      expect(blueveryCore.getState().managingPeripherals['1'].communicate).toBe(
        undefined,
      );
      await blueveryCore.readValue(['1', 'dummySUUID', 'dummyCharaUUID'], {});
      // finally status
      expect(blueveryCore.getState().managingPeripherals['1'].communicate).toBe(
        'nonCommunicate',
      );
    });

    test('readValue: check calls', async () => {
      await blueveryCore.readValue(['1', 'dummySUUID', 'dummyCharaUUID'], {});
      expect(BleManager.read).toBeCalled();
      expect(spiedRequireCheckBeforeBleProcess).toBeCalled();
      expect(spiedCheckThePeripheralIsManaging).toBeCalled();
    });

    test('readValue: should throw if error occured', async () => {
      // @ts-expect-error
      BleManager.read.mockImplementationOnce(async () => {
        throw new Error('fixture error');
      });

      const _read = blueveryCore.readValue(
        ['1', 'dummySUUID', 'dummyCharaUUID'],
        {},
      );
      await expect(_read).rejects.toThrow('fixture error');
    });
  });

  describe('conect', () => {
    beforeEach(() => {
      blueveryCore = new BlueveryCore({
        blueveryListeners: new BlueveryListeners(),
        BlueveryState,
        initialState: createInitialState({
          scannedPeripherals: {['1']: dummyPeripheralInfo('1')},
        }),
      });
    });

    test('connect: should be change connect of state the managing peripheral', async () => {
      const spyConnectState = jest.fn();
      blueveryCore = new BlueveryCore({
        blueveryListeners: new BlueveryListeners(),
        BlueveryState,
        initialState: createInitialState({
          scannedPeripherals: {['1']: dummyPeripheralInfo('1')},
          managingPeripherals: {['1']: dummyPeripheralInfo('1')},
        }),
        onChangeStateHandler: (state) => {
          spyConnectState(state.managingPeripherals['1'].connect);
        },
      });
      // check initial status
      expect(blueveryCore.getState().managingPeripherals['1'].connect).toBe(
        undefined,
      );
      await blueveryCore.connect({
        bondingParams: ['1', ''],
        bondingOptions: {},
        connectParams: ['1'],
        connectOptions: {},
        retrieveServicesParams: ['1'],
        retrieveServicesOptions: {},
      });

      expect(spyConnectState.mock.calls[0][0]).toBe(undefined);
      expect(spyConnectState.mock.calls[1][0]).toBe('connecting');
      expect(spyConnectState.mock.calls[2][0]).toBe('connected');
    });

    test('connect: should be throw if not found peripheral in scannedPeripherals', async () => {
      const connecting = blueveryCore.connect({
        bondingParams: ['1', ''],
        bondingOptions: {},
        connectParams: ['2'],
        connectOptions: {},
        retrieveServicesParams: ['1'],
        retrieveServicesOptions: {},
      });
      await expect(connecting).rejects.toThrow();
    });

    test('connect: check calls', async () => {
      await blueveryCore.connect({
        bondingParams: ['1', ''],
        bondingOptions: {},
        connectParams: ['1'],
        connectOptions: {},
        retrieveServicesParams: ['1'],
        retrieveServicesOptions: {},
      });
      expect(BleManager.connect).toBeCalled();
      expect(BleManager.retrieveServices).toBeCalled();
      expect(BleManager.createBond).toBeCalled();
      expect(spiedRequireCheckBeforeBleProcess).toBeCalled();
    });
  });

  describe('startNotification', () => {
    test('startNotification: should be reset the previous listener, if there is one', async () => {
      const mockRemoveFn = jest.fn();
      const spyReceivingCharaValueState = jest.fn();

      const blueveryListeners = new BlueveryListeners();
      blueveryListeners.setAnyPublicSubscription(
        '1',
        'receivingForCharacteristicValueListener',
        ({remove: mockRemoveFn} as unknown) as EmitterSubscription,
      );
      blueveryCore = new BlueveryCore({
        BlueveryState,
        blueveryListeners,
        initialState: createInitialState({
          managingPeripherals: {['1']: dummyPeripheralInfo('1')},
        }),
        onChangeStateHandler: (state) => {
          spyReceivingCharaValueState(
            state.managingPeripherals['1'].receivingForCharacteristicValue,
          );
        },
      });
      await blueveryCore.startNotification({
        startNotificationParams: ['1', 'test', 'test'],
        receiveCharacteristicHandler: () => {},
      });
      expect(mockRemoveFn).toBeCalled();
      expect(spyReceivingCharaValueState.mock.calls[0][0]).toBe(false);
    });

    test('startNotification: should be receiving characteristic value', async () => {
      const spyReceivingCharaValueState = jest.fn();

      const blueveryListeners = new BlueveryListeners();
      blueveryCore = new BlueveryCore({
        BlueveryState,
        blueveryListeners,
        initialState: createInitialState({
          managingPeripherals: {['1']: dummyPeripheralInfo('1')},
        }),
        onChangeStateHandler: (state) => {
          spyReceivingCharaValueState(
            state.managingPeripherals['1'].receivingForCharacteristicValue,
          );
        },
      });
      await blueveryCore.startNotification({
        startNotificationParams: ['1', 'test', 'test'],
        receiveCharacteristicHandler: () => {},
      });
      expect(
        blueveryListeners.publicListeners['1']
          .receivingForCharacteristicValueListener,
      ).not.toBeUndefined();
      expect(spyReceivingCharaValueState.mock.calls[0][0]).toBe(true);
    });
    test('startNotification: connect: check calls', async () => {
      const blueveryListeners = new BlueveryListeners();
      blueveryCore = new BlueveryCore({
        BlueveryState,
        blueveryListeners,
        initialState: createInitialState({
          managingPeripherals: {['1']: dummyPeripheralInfo('1')},
        }),
      });
      await blueveryCore.startNotification({
        startNotificationParams: ['1', 'test', 'test'],
        receiveCharacteristicHandler: () => {},
      });

      expect(BleManager.startNotification).toBeCalled();
    });
  });

  describe('stopNotification', () => {
    test('should be clean the satrting notification', async () => {
      const mockRemoveFn = jest.fn();
      const spyReceivingCharaValueState = jest.fn();

      const blueveryListeners = new BlueveryListeners();
      blueveryListeners.setAnyPublicSubscription(
        '1',
        'receivingForCharacteristicValueListener',
        ({remove: mockRemoveFn} as unknown) as EmitterSubscription,
      );
      blueveryCore = new BlueveryCore({
        BlueveryState,
        blueveryListeners,
        initialState: createInitialState({
          managingPeripherals: {['1']: dummyPeripheralInfo('1')},
        }),
        onChangeStateHandler: (state) => {
          spyReceivingCharaValueState(
            state.managingPeripherals['1'].receivingForCharacteristicValue,
          );
        },
      });
      await blueveryCore.stopNotification({
        stopNotificationParams: ['1', 'test,', 'test'],
      });

      expect(BleManager.stopNotification).toBeCalled();
      expect(mockRemoveFn).toBeCalled();
      expect(spyReceivingCharaValueState.mock.calls[0][0]).toBe(false);
    });
  });
});
