import {BlueveryCore} from '../src/blueveryCore';
import {BlueveryState} from '../src/blueveryState';
import {
  checkBluetoothEnabled,
  checkPermission,
  requestPermission,
} from '../src/libs';
import {flushPromisesAdvanceTimer} from './__utils__/flushPromisesAdvanceTimer';
import BleManager from 'react-native-ble-manager';

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
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let spiedCheckAndRequestPermission: jest.SpyInstance;
let spiedCheckBluetoothEnabled: jest.SpyInstance;
let spiedRequireCheckBeforeBleProcess: jest.SpyInstance;
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

  // note: need create instance after spyOn
  blueveryCore = new BlueveryCore({BlueveryState});
});

describe('BlueveryCore', () => {
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
        blueveryCore = new BlueveryCore({BlueveryState});

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
          blueveryCore = new BlueveryCore({BlueveryState});

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
          blueveryCore = new BlueveryCore({BlueveryState});

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
      blueveryCore = new BlueveryCore({BlueveryState});

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
        blueveryCore = new BlueveryCore({BlueveryState});

        // @ts-ignore ts(2341) access to private
        const ret = await blueveryCore.requireCheckBeforeBleProcess();
        expect(ret).toBe(false);
      });
      test('should return false if is not BluetoothEnabled requestedButUngranted', async () => {
        spiedCheckBluetoothEnabled.mockResolvedValueOnce(false);
        // unSpy requireCheckBeforeBleProcess because want to test with substance method
        spiedRequireCheckBeforeBleProcess.mockRestore();
        blueveryCore = new BlueveryCore({BlueveryState});

        // @ts-ignore ts(2341) access to private
        const ret = await blueveryCore.requireCheckBeforeBleProcess();
        expect(ret).toBe(false);
      });
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
        blueveryCore = new BlueveryCore({BlueveryState});

        mockedCheckBluetoothEnabled.mockImplementationOnce(async () => true);
        // @ts-ignore ts(2341) access to private
        await blueveryCore.checkBluetoothEnabled();
        // @ts-ignore ts(2341) access to private
        expect(blueveryCore.getState().bluetoothEnabled).toBe(true);
      });

      test('the result is disabled', async () => {
        // unSpy
        spiedCheckBluetoothEnabled.mockRestore();
        blueveryCore = new BlueveryCore({BlueveryState});

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
          blueveryCore = new BlueveryCore({BlueveryState});
          await flushPromisesAdvanceTimer(1000);
          expect(BleManager.scan).not.toBeCalled();
        });
        test('should not guard return true', async () => {
          spiedRequireCheckBeforeBleProcess.mockResolvedValueOnce(true);
          blueveryCore = new BlueveryCore({BlueveryState});
          blueveryCore.scan({scanningSettings: [[], 1]});
          await flushPromisesAdvanceTimer(1000);
          expect(BleManager.scan).toBeCalled();
        });
      });
    });
  });
});
