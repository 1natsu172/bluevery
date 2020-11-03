import {BlueveryCore} from '../src/blueveryCore';
import {BlueveryState} from '../src/blueVeryState';
import {checkBluetoothEnabled} from '../src/libs';
import {flushPromisesAdvanceTimer} from './__utils__/flushPromisesAdvanceTimer';

jest.mock('../src/libs', () => ({
  __esModule: true,
  checkBluetoothEnabled: jest.fn(async () => true),
}));

/**
 * prepare instances & spiedMethods
 */
let blueveryCore: BlueveryCore;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let spiedCheckAndRequestPermission: jest.SpyInstance;
let spiedRequireCheckBeforeBleProcess: jest.SpyInstance;
let spiedCleanupScan: jest.SpyInstance;
beforeEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();

  // note: methods spying
  spiedCheckAndRequestPermission = jest
    // @ts-ignore
    .spyOn(BlueveryCore.prototype, 'checkAndRequestPermission')
    // @ts-ignore
    .mockImplementation(async () => []);
  spiedRequireCheckBeforeBleProcess = jest
    // @ts-ignore
    .spyOn(BlueveryCore.prototype, 'requireCheckBeforeBleProcess')
    // @ts-ignore
    .mockImplementation(async () => {});
  spiedCleanupScan = jest
    // @ts-ignore
    .spyOn(BlueveryCore.prototype, 'cleanupScan');

  // note: need create instance after spyOn
  blueveryCore = new BlueveryCore({BlueveryState});
});

describe('BlueveryCore', () => {
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
  });

  describe('checkBluetoothEnabled', () => {
    const mockedCheckBluetoothEnabled = checkBluetoothEnabled as jest.MockedFunction<
      typeof checkBluetoothEnabled
    >;
    describe('should change state the depend on the result', () => {
      test('the result is enabled', async () => {
        mockedCheckBluetoothEnabled.mockImplementationOnce(async () => true);
        // @ts-ignore ts(2341) access to private
        await blueveryCore.checkBluetoothEnabled();
        // @ts-ignore ts(2341) access to private
        expect(blueveryCore.getState().bluetoothEnabled).toBe(true);
      });

      test('the result is disabled', async () => {
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
    });

    describe('discoverHandler', () => {
      test.skip('should call passed handler', () => {});
    });

    describe('matchFn', () => {
      test.skip('should discover only that match the result of matchFn', () => {
        // discoverHandlerの呼ばれる回数をモックする
      });
    });
  });
});
