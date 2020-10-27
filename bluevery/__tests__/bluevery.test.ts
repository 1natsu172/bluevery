import {bluevery as truthExportedBluevery} from '../src/bluevery';
import {Bluevery} from '../src/bluevery/bluevery';
import {BlueveryCore} from '../src/bluevery/blueveryCore';
import {BlueveryState} from '../src/bluevery/blueVeryState';
import {flushPromisesAdvanceTimer} from './__utils__/flushPromisesAdvanceTimer';

let bluevery: Bluevery;
beforeEach(() => {
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
    describe('interval', () => {
      const scanFn = jest.fn();
      const core = jest.fn().mockImplementation(() => ({
        scan: scanFn,
      }));
      jest.useFakeTimers();

      beforeEach(() => {
        scanFn.mockClear();
        bluevery = new Bluevery({BlueveryCore: core, BlueveryState});
      });
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
  });
});
