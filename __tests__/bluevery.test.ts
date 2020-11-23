import {bluevery as truthExportedBluevery} from '../src';
import {Bluevery} from '../src/bluevery';
import {BlueveryCore} from '../src/blueveryCore';
import {BlueveryState} from '../src/blueveryState';
import * as omoiyarify from '../src/libs/omoiyarify';
import {flushPromisesAdvanceTimer} from './__utils__/flushPromisesAdvanceTimer';

let bluevery: Bluevery;
let spiedApplyOmoiyari: jest.SpyInstance;
beforeEach(() => {
  // cleanup spies
  jest.restoreAllMocks();
  spiedApplyOmoiyari = jest.spyOn(omoiyarify, 'applyOmoiyari');

  bluevery = new Bluevery({BlueveryCore, BlueveryState});
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
    test('should return isInitialized', () => {
      const actual = bluevery.checkIsInitialized();
      expect(actual).toBe(false);
      bluevery.init();
      const actualThenInitialized = bluevery.checkIsInitialized();
      expect(actualThenInitialized).toBe(true);
    });
  });

  describe('forceCheckState', () => {
    const listenerHandler = jest.fn((state) => state);

    afterAll(() => {
      // cleanup listener.
      bluevery.listeners.stateListener.offAll();
    });

    test('should emit on the state change.', () => {
      bluevery.listeners.stateListener.on(listenerHandler);
      bluevery.forceCheckState();
      expect(listenerHandler).toHaveBeenCalledTimes(1);

      bluevery.forceCheckState();
      expect(listenerHandler).toHaveBeenCalledTimes(2);
    });
  });

  describe('stopBluevery', () => {
    test.skip('should reset bluevery completely ', () => {});
  });
});

describe('bluevery: commands APIs', () => {
  describe('init', () => {
    test('can only init once', () => {
      bluevery.init();
      expect(() => bluevery.init()).toThrow();
    });

    test.skip('setting userDefinedOptions', () => {});
  });

  describe('startScan', () => {
    jest.useFakeTimers();
    const scanFn = jest.fn();
    const core = jest.fn().mockImplementation(() => ({
      scan: scanFn,
    }));

    beforeEach(() => {
      scanFn.mockClear();
      bluevery = new Bluevery({BlueveryCore: core, BlueveryState});
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
  });
});
