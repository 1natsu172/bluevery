import {bluevery as truthExportedBluevery} from '../src';
import {Bluevery} from '../src/bluevery';
import {BlueveryCore} from '../src/blueveryCore';
import {BlueveryState} from '../src/blueveryState';
import {BlueveryListeners} from '../src/blueveryListeners';
import * as omoiyarify from '../src/utils/omoiyarify';
import {flushPromisesAdvanceTimer} from './__utils__/flushPromisesAdvanceTimer';

let bluevery: Bluevery;
let spiedApplyOmoiyari: jest.SpyInstance;
beforeEach(() => {
  // cleanup spies
  jest.restoreAllMocks();
  spiedApplyOmoiyari = jest.spyOn(omoiyarify, 'applyOmoiyari');

  bluevery = new Bluevery({
    BlueveryCore,
    BlueveryState,
    blueveryListeners: new BlueveryListeners(),
  });
});

describe('truthExportedBluevery', () => {
  describe('bluevery is singleton', () => {
    test('only the object', () => {
      const a = truthExportedBluevery;
      const b = truthExportedBluevery;
      expect(a === b).toBe(true);
    });
  });
});

describe('bluevery: primitive APIs', () => {
  describe('checkIsInitialized', () => {
    test('should return isInitialized', async () => {
      const actual = bluevery.checkIsInitialized();
      expect(actual).toBe(false);
      await bluevery.init();
      const actualThenInitialized = bluevery.checkIsInitialized();
      expect(actualThenInitialized).toBe(true);
    });
  });

  describe('stopBluevery', () => {
    test.todo('should reset bluevery completely');
  });
});

describe('bluevery: commands APIs', () => {
  describe('init', () => {
    test.skip('can only init once', () => {
      bluevery.init();
      expect(() => bluevery.init()).toBe(undefined);
    });

    test.skip('setting userDefinedOptions', () => {});
  });

  describe('startScan', () => {
    jest.useFakeTimers();
    const scanFn = jest.fn();
    const clearScannedPeripheralsFn = jest.fn();
    const core = (jest.fn().mockImplementation(() => ({
      scan: scanFn,
      clearScannedPeripherals: clearScannedPeripheralsFn,
    })) as unknown) as typeof BlueveryCore;

    beforeEach(() => {
      jest.clearAllMocks();
      bluevery = new Bluevery({
        BlueveryCore: core,
        BlueveryState,
        blueveryListeners: new BlueveryListeners(),
      });
    });
    describe('interval', () => {
      test('should correct intervalLength', async () => {
        bluevery.startScan({
          scanOptions: {
            scanningSettings: [[], 1, true],
            intervalLength: 50,
            iterations: 3,
          },
        });

        await flushPromisesAdvanceTimer(50);
        expect(scanFn).toHaveBeenCalledTimes(1);
        await flushPromisesAdvanceTimer(50);
        expect(scanFn).toHaveBeenCalledTimes(2);
        await flushPromisesAdvanceTimer(50);
        expect(scanFn).toHaveBeenCalledTimes(3);
      });
      test('no interval pattern', async () => {
        bluevery.startScan({
          scanOptions: {
            scanningSettings: [[], 1, true],
            intervalLength: 0,
            iterations: 3,
          },
        });

        await flushPromisesAdvanceTimer(0);
        expect(scanFn).toHaveBeenCalledTimes(1);
        await flushPromisesAdvanceTimer(0);
        expect(scanFn).toHaveBeenCalledTimes(2);
        await flushPromisesAdvanceTimer(0);
        expect(scanFn).toHaveBeenCalledTimes(3);
      });
      test('should iterate the number of times', async () => {
        bluevery.startScan({
          scanOptions: {
            scanningSettings: [[], 1, true],
            intervalLength: 50,
            iterations: 50,
          },
        });

        jest.runAllTimers();
        expect(scanFn).toHaveBeenCalledTimes(50);
      });
      test('should possible non iterate', async () => {
        bluevery.startScan({
          scanOptions: {
            scanningSettings: [[], 1, true],
            intervalLength: 500,
            iterations: 1,
          },
        });

        jest.runAllTimers();
        expect(scanFn).toHaveBeenCalledTimes(1);
        expect(scanFn).not.toHaveBeenCalledTimes(2);
      });
      test('should not call immediate scan function', async () => {
        bluevery.startScan({
          scanOptions: {
            scanningSettings: [[], 1, true],
            intervalLength: 500,
            iterations: 1,
          },
        });

        await flushPromisesAdvanceTimer(499);
        expect(scanFn).toHaveBeenCalledTimes(0);
        await flushPromisesAdvanceTimer(500);
        expect(scanFn).toHaveBeenCalledTimes(1);
      });
    });
    describe('omoiyari', () => {
      test('should call omoiyarify', () => {
        bluevery.startScan({
          scanOptions: {
            scanningSettings: [[], 1, true],
            intervalLength: 0,
            iterations: 1,
          },
        });
        jest.runAllTimers();
        expect(spiedApplyOmoiyari).toBeCalledTimes(1);
      });

      test('should behave omoiyari with 1sec', async () => {
        const subsequentProcessing = jest.fn();
        bluevery
          .startScan({
            scanOptions: {
              scanningSettings: [[], 1, true],
              intervalLength: 0,
              iterations: 1,
            },
          })
          .then(subsequentProcessing);
        // flush intervalScan loop
        await flushPromisesAdvanceTimer(0);
        // shoukd not yet called subsequentProcessing
        expect(subsequentProcessing).toHaveBeenCalledTimes(0);
        // flush omoiyari loop
        await flushPromisesAdvanceTimer(1000).then(() =>
          // omoiyari は nested な setTimeout になるので2回flushしないといけない
          flushPromisesAdvanceTimer(0),
        );
        // called after being omoiyari
        expect(subsequentProcessing).toHaveBeenCalledTimes(1);
      });
    });
    describe('startScan: check calls', () => {
      test('should call core.clearScannedPeripherals', async () => {
        bluevery.startScan({
          scanOptions: {
            scanningSettings: [[], 1, true],
            intervalLength: 0,
            iterations: 1,
          },
        });
        jest.runAllTimers();
        expect(clearScannedPeripheralsFn).toBeCalledTimes(1);
      });
    });
  });

  describe('writeValue', () => {
    const writeValueFn = jest.fn(() => 'wrote to peripheral');
    const core = (jest.fn().mockImplementation(() => ({
      writeValue: writeValueFn,
    })) as unknown) as typeof BlueveryCore;

    beforeEach(() => {
      jest.clearAllMocks();
      bluevery = new Bluevery({
        BlueveryCore: core,
        BlueveryState,
        blueveryListeners: new BlueveryListeners(),
      });
    });

    describe('writeValue: positive pattern', () => {
      test('should return value if exist', async () => {
        const wrote = await bluevery.writeValue([
          'dummyPid',
          'dummySUuid',
          'dummyCharaValue',
          'this is data',
        ]);
        expect(wrote).toBe('wrote to peripheral');
      });
    });

    describe('writeValue: check calls', () => {
      test('should call core#writeValue', async () => {
        await bluevery.writeValue([
          'dummyPid',
          'dummySUuid',
          'dummyCharaValue',
          'this is data',
        ]);
        expect(writeValueFn).toBeCalled();
      });
    });
  });

  describe('readValue', () => {
    const readValueFn = jest.fn(() => 'read to peripheral');
    const core = (jest.fn().mockImplementation(() => ({
      readValue: readValueFn,
    })) as unknown) as typeof BlueveryCore;

    beforeEach(() => {
      jest.clearAllMocks();
      bluevery = new Bluevery({
        BlueveryCore: core,
        BlueveryState,
        blueveryListeners: new BlueveryListeners(),
      });
    });

    describe('readValue: positive pattern', () => {
      test('should return value if exist', async () => {
        const read = await bluevery.readValue([
          'dummyPid',
          'dummySUuid',
          'dummyCharaValue',
        ]);
        expect(read).toBe('read to peripheral');
      });
    });

    describe('readValue: check calls', () => {
      test('should call core#readValue', async () => {
        await bluevery.readValue(['dummyPid', 'dummySUuid', 'dummyCharaValue']);
        expect(readValueFn).toBeCalled();
      });
    });
  });

  describe('connect', () => {
    test.todo('should ');
  });

  describe('receiveCharacteristicValue', () => {
    const connectFn = jest.fn();
    let startScanFn = jest.fn();
    let spiedStartNotification: jest.SpyInstance;

    beforeEach(() => {
      jest.clearAllMocks();
      //cleanup spys
      jest.restoreAllMocks();

      spiedStartNotification = jest
        .spyOn(BlueveryCore.prototype, 'startNotification')
        .mockImplementation(async () => {});

      bluevery = new Bluevery({
        BlueveryCore,
        BlueveryState,
        blueveryListeners: new BlueveryListeners(),
      });
      bluevery.connect = connectFn;
      bluevery.startScan = startScanFn;
    });

    test('should be repeat the scan until find the target peripheral', async () => {
      /**
       * do...whileのテストのために動的にstateが変わるのを再現している
       */
      const createMockScanFn = (callCount: number, foundTiming: number) =>
        jest.fn(async () => {
          callCount += 1;
          if (callCount >= foundTiming) {
            // @ts-expect-error
            bluevery.core.state.setPeripheralToScannedPeripherals({
              id: '1',
            });
          }
        });
      startScanFn = createMockScanFn(0, 3);
      bluevery.startScan = startScanFn;

      await bluevery.receiveCharacteristicValue({
        scanParams: {scanOptions: {scanningSettings: [['1'], 1]}},
        retrieveServicesParams: ['1'],
        connectParams: ['1'],
        bondingParams: ['1', 'test'],
        startNotificationParams: ['1', 'test', 'test'],
        receiveCharacteristicHandler: () => {},
      });

      expect(startScanFn.mock.calls.length).toBeGreaterThanOrEqual(3);
    });

    describe('receiveCharacteristicValue: check calls', () => {
      beforeEach(async () => {
        await bluevery.receiveCharacteristicValue({
          scanParams: {scanOptions: {scanningSettings: [['1'], 1]}},
          retrieveServicesParams: ['1'],
          connectParams: ['1'],
          bondingParams: ['1', 'test'],
          startNotificationParams: ['1', 'test', 'test'],
          receiveCharacteristicHandler: () => {},
        });
      });
      test('should call startScan', async () => {
        expect(startScanFn).toBeCalled();
      });
      test('should call connect', async () => {
        expect(connectFn).toBeCalled();
      });
      test('should call startNotification', async () => {
        expect(spiedStartNotification).toBeCalled();
      });
    });
  });

  describe('stopReceiveCharacteristicValue', () => {
    const stopNotificationFn = jest.fn();
    const core = (jest.fn().mockImplementation(() => ({
      stopNotification: stopNotificationFn,
    })) as unknown) as typeof BlueveryCore;

    beforeEach(() => {
      jest.clearAllMocks();
      bluevery = new Bluevery({
        BlueveryCore: core,
        BlueveryState,
        blueveryListeners: new BlueveryListeners(),
      });
    });

    describe('stopNotification: check calls', () => {
      test('should call core#stopNotification', async () => {
        await bluevery.stopReceiveCharacteristicValue({
          stopNotificationParams: ['1', 'test', 'test'],
        });
        expect(stopNotificationFn).toBeCalled();
      });
    });
  });
});
