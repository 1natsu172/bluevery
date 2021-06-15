import 'jest-extended';
import {proxy} from 'valtio';
import {bluevery as truthExportedBluevery} from '../src';
import {Bluevery} from '../src/bluevery';
import {BlueveryCore} from '../src/blueveryCore';
import {BlueveryState, createInitialState} from '../src/blueveryState';
import {BlueveryListeners} from '../src/blueveryListeners';
import * as omoiyarify from '../src/utils/omoiyarify';
import {flushPromisesAdvanceTimer} from './__utils__/flushPromisesAdvanceTimer';
import {dummyPeripheralInfo} from './__utils__/dummyPeripheralInfo';
import {mockPlatform} from './__utils__/mockPlatform';
import {EmitterSubscription, NativeEventEmitter} from 'react-native';
import {DisconnectedPeripheralInfo} from '../src/libs';

const nativeEventEmitter = new NativeEventEmitter();

let bluevery: Bluevery;
let spiedApplyOmoiyari: jest.SpyInstance;
let spiedCoreInit: jest.SpyInstance;
beforeEach(async () => {
  // cleanup spies
  jest.restoreAllMocks();
  spiedApplyOmoiyari = jest.spyOn(omoiyarify, 'applyOmoiyari');
  // NOTE: core#initでdisconnectのリスナーが張られるが、removeされないまま残ってしまうと他のテストがコケるのでメソッド自体モックしておく。実体実行したいテストでのみrestoreするようにする。
  spiedCoreInit = jest
    .spyOn(BlueveryCore.prototype, 'init')
    .mockImplementation(async () => {});

  bluevery = new Bluevery({
    BlueveryCore,
    BlueveryState,
    blueveryListeners: new BlueveryListeners(),
    store: proxy({bluevery: createInitialState()}),
  });
  await bluevery.init();
});
afterEach(async () => {
  // NOTE: トップレベルbeforeEachで1度initしてるのでtestするたびに以前のリスナーがどんどん残ってしまう。なので各test後に毎回stopしておく
  await bluevery.stopBluevery();
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
      bluevery = new Bluevery({
        BlueveryCore,
        BlueveryState,
        blueveryListeners: new BlueveryListeners(),
        store: proxy({bluevery: createInitialState()}),
      });
      const actual = bluevery.checkIsInitialized();
      expect(actual).toBe(false);
      await bluevery.init();
      const actualThenInitialized = bluevery.checkIsInitialized();
      expect(actualThenInitialized).toBe(true);
    });
  });

  describe('stopBluevery', () => {
    const blueveryListeners = new BlueveryListeners();
    const mockPublicSubscriptions = [jest.fn(), jest.fn(), jest.fn()];
    const mockInternalSubscriptions = [jest.fn(), jest.fn(), jest.fn()];
    mockPublicSubscriptions.forEach((subscription, index) => {
      blueveryListeners.setAnyPublicSubscription(
        index.toString(),
        // @ts-expect-error
        `test${index}`,
        ({remove: subscription} as unknown) as EmitterSubscription,
      );
    });
    mockInternalSubscriptions.forEach((subscription, index) => {
      // @ts-expect-error
      blueveryListeners.setAnyInternalSubscription(`test${index}`, ({
        remove: subscription,
      } as unknown) as EmitterSubscription);
    });

    const onChangeStateHandler = jest.fn();

    beforeEach(async () => {
      bluevery = new Bluevery({
        BlueveryCore,
        BlueveryState,
        blueveryListeners,
        store: proxy({bluevery: createInitialState()}),
      });
      await bluevery.init({onChangeStateHandler});
    });

    test('should stop bluevery completely', async () => {
      // @ts-expect-error テストのためにprivateプロパティアクセスしている
      bluevery.core.state.onScanning();
      expect(onChangeStateHandler).toBeCalledTimes(1);

      await bluevery.stopBluevery();

      mockPublicSubscriptions.forEach((subscription) =>
        expect(subscription).toBeCalled(),
      );
      mockInternalSubscriptions.forEach((subscription) =>
        expect(subscription).toBeCalled(),
      );

      // @ts-expect-error テストのためにprivateプロパティアクセスしている
      bluevery.core.state.offScanning();
      expect(onChangeStateHandler).toBeCalledTimes(1);
    });
  });
});

describe('bluevery: commands APIs', () => {
  describe('init', () => {
    beforeEach(async () => {
      spiedCoreInit.mockRestore();
      bluevery = new Bluevery({
        BlueveryCore,
        BlueveryState,
        blueveryListeners: new BlueveryListeners(),
        store: proxy({bluevery: createInitialState()}),
      });
    });

    test('can only init once', async () => {
      const initFn = jest.fn();
      const core = (jest.fn().mockImplementation(() => ({
        listeners: {publicListeners: {}},
        state: new BlueveryState({
          store: proxy({bluevery: createInitialState()}),
        }),
        init: initFn,
      })) as unknown) as typeof BlueveryCore;

      bluevery = new Bluevery({
        BlueveryCore: core,
        BlueveryState,
        blueveryListeners: new BlueveryListeners(),
        store: proxy({bluevery: createInitialState()}),
      });
      await bluevery.init();
      const secondTryInit = await bluevery.init();
      expect(secondTryInit).toBe(undefined);
      expect(initFn).toHaveBeenCalledTimes(1);
    });

    test('user should be able to know that disconnected', async () => {
      const optionalDisconnectHandler = jest.fn();
      const testerPeripheral = dummyPeripheralInfo('tester1');
      bluevery = new Bluevery({
        BlueveryCore,
        BlueveryState,
        blueveryListeners: new BlueveryListeners(),
        store: proxy({bluevery: createInitialState()}),
      });
      await bluevery.init({
        onDisconnectPeripheralHandler: optionalDisconnectHandler,
      });
      // @ts-expect-error
      bluevery.core.state.setPeripheralToManagingPeripherals(testerPeripheral);
      const disconnectInfo: DisconnectedPeripheralInfo = {
        peripheral: testerPeripheral.id,
        status: 1,
      };
      nativeEventEmitter.emit('BleManagerDisconnectPeripheral', disconnectInfo);
      // @ts-expect-error
      const state = bluevery.core.getState();
      expect(state.managingPeripherals.tester1.connect).toBe('disconnected');
      expect(optionalDisconnectHandler).toBeCalled();
      expect(bluevery.publicListeners[testerPeripheral.id]).toBe(undefined);
    });

    describe('save the already connected & bonded peripherals at init', () => {
      test('iOS: should save the already connected', async () => {
        await bluevery.init();
        // @ts-expect-error
        const managingPeripherals = bluevery.core.getState()
          .managingPeripherals;
        expect(managingPeripherals).toHaveProperty('connected1');
        expect(managingPeripherals).toHaveProperty('connected2');
        expect(managingPeripherals).toHaveProperty('connected3');
        expect(managingPeripherals).not.toHaveProperty('connected4');
        expect(managingPeripherals).not.toHaveProperty('bonded1');
      });

      test('Android: should save the already connected & bonded', async () => {
        mockPlatform('android', 10);
        await bluevery.init();
        // @ts-expect-error
        const managingPeripherals = bluevery.core.getState()
          .managingPeripherals;
        expect(managingPeripherals).toHaveProperty('connected1');
        expect(managingPeripherals).toHaveProperty('connected2');
        expect(managingPeripherals).toHaveProperty('connected3');
        expect(managingPeripherals).not.toHaveProperty('connected4');
        expect(managingPeripherals).toHaveProperty('bonded1');
        expect(managingPeripherals).toHaveProperty('bonded2');
        expect(managingPeripherals).toHaveProperty('bonded3');
        expect(managingPeripherals).not.toHaveProperty('bonded4');
      });
    });
  });

  describe('startScan', () => {
    jest.useFakeTimers();
    const scanFn = jest.fn();
    const initFn = jest.fn();
    const clearScannedPeripheralsFn = jest.fn();
    const core = (jest.fn().mockImplementation(() => ({
      listeners: {publicListeners: {}},
      init: initFn,
      scan: scanFn,
      clearScannedPeripherals: clearScannedPeripheralsFn,
    })) as unknown) as typeof BlueveryCore;

    beforeEach(async () => {
      jest.clearAllMocks();
      bluevery = new Bluevery({
        BlueveryCore: core,
        BlueveryState,
        blueveryListeners: new BlueveryListeners(),
        store: proxy({bluevery: createInitialState()}),
      });
      await bluevery.init();
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

      test('should change isStopScanInterval to false', () => {
        // @ts-expect-error -- テストのためにprivateプロパティアクセスしている
        bluevery.isStopScanInterval = true;
        // @ts-expect-error -- テストのためにprivateプロパティアクセスしている
        expect(bluevery.isStopScanInterval).toBe(true);

        bluevery.startScan({
          scanOptions: {
            scanningSettings: [[], 1, true],
            intervalLength: 0,
            iterations: 1,
          },
        });
        jest.runAllTimers();

        // @ts-expect-error -- テストのためにprivateプロパティアクセスしている
        expect(bluevery.isStopScanInterval).toBe(false);
      });
    });
  });

  describe('stopScan', () => {
    jest.useFakeTimers();
    const scanFn = jest.fn();
    const initFn = jest.fn();
    const clearScannedPeripheralsFn = jest.fn();
    const cleanupScanFn = jest.fn();
    const core = (jest.fn().mockImplementation(() => ({
      listeners: {publicListeners: {}},
      init: initFn,
      scan: scanFn,
      clearScannedPeripherals: clearScannedPeripheralsFn,
      cleanupScan: cleanupScanFn,
    })) as unknown) as typeof BlueveryCore;

    beforeEach(async () => {
      jest.clearAllMocks();
      bluevery = new Bluevery({
        BlueveryCore: core,
        BlueveryState,
        blueveryListeners: new BlueveryListeners(),
        store: proxy({bluevery: createInitialState()}),
      });
      await bluevery.init();
    });

    test('stopScan: check calls', async () => {
      //@ts-expect-error -- テストのためにprivateプロパティアクセスしている
      expect(bluevery.isStopScanInterval).toBe(false);

      await bluevery.stopScan();
      //@ts-expect-error -- テストのためにprivateプロパティアクセスしている
      expect(bluevery.isStopScanInterval).toBe(true);
      expect(cleanupScanFn).toHaveBeenCalledTimes(1);
    });

    test('should stop interval', async () => {
      bluevery.startScan({
        scanOptions: {
          scanningSettings: [[], 1, true],
          intervalLength: 50,
          iterations: 5,
        },
      });

      await flushPromisesAdvanceTimer(50);
      expect(scanFn).toHaveBeenCalledTimes(1);
      await flushPromisesAdvanceTimer(50);
      expect(scanFn).toHaveBeenCalledTimes(2);

      await bluevery.stopScan();

      // flush all times
      jest.runAllTimers();
      // but the call is still two times, because stopped the interval
      expect(scanFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('writeValue', () => {
    const writeValueFn = jest.fn(() => 'wrote to peripheral');
    const core = (jest.fn().mockImplementation(() => ({
      listeners: {publicListeners: {}},
      init: jest.fn(),
      writeValue: writeValueFn,
    })) as unknown) as typeof BlueveryCore;

    beforeEach(async () => {
      jest.clearAllMocks();
      bluevery = new Bluevery({
        BlueveryCore: core,
        BlueveryState,
        blueveryListeners: new BlueveryListeners(),
        store: proxy({bluevery: createInitialState()}),
      });
      await bluevery.init();
    });

    describe('writeValue: positive pattern', () => {
      test('should return value if exist', async () => {
        const wrote = await bluevery.writeValue({
          writeValueParams: [
            'dummyPid',
            'dummySUuid',
            'dummyCharaValue',
            'this is data',
          ],
          retrieveServicesParams: ['dummyPid'],
        });
        expect(wrote).toBe('wrote to peripheral');
      });
    });

    describe('writeValue: check calls', () => {
      test('should call core#writeValue', async () => {
        await bluevery.writeValue({
          writeValueParams: [
            'dummyPid',
            'dummySUuid',
            'dummyCharaValue',
            'this is data',
          ],
          retrieveServicesParams: ['dummyPid'],
        });
        expect(writeValueFn).toBeCalled();
      });
    });
  });

  describe('readValue', () => {
    const readValueFn = jest.fn(() => 'read to peripheral');
    const core = (jest.fn().mockImplementation(() => ({
      listeners: {publicListeners: {}},
      init: jest.fn(),
      readValue: readValueFn,
    })) as unknown) as typeof BlueveryCore;

    beforeEach(async () => {
      jest.clearAllMocks();
      bluevery = new Bluevery({
        BlueveryCore: core,
        BlueveryState,
        blueveryListeners: new BlueveryListeners(),
        store: proxy({bluevery: createInitialState()}),
      });
      await bluevery.init();
    });

    describe('readValue: positive pattern', () => {
      test('should return value if exist', async () => {
        const read = await bluevery.readValue({
          readValueParams: ['dummyPid', 'dummySUuid', 'dummyCharaValue'],
          retrieveServicesParams: ['dummyPid'],
        });
        expect(read).toBe('read to peripheral');
      });
    });

    describe('readValue: check calls', () => {
      test('should call core#readValue', async () => {
        await bluevery.readValue({
          readValueParams: ['dummyPid', 'dummySUuid', 'dummyCharaValue'],
          retrieveServicesParams: ['dummyPid'],
        });
        expect(readValueFn).toBeCalled();
      });
    });
  });

  describe('connect', () => {
    const connectFn = jest.fn();
    const core = (jest.fn().mockImplementation(() => ({
      listeners: {publicListeners: {}},
      init: jest.fn(),
      connect: connectFn,
    })) as unknown) as typeof BlueveryCore;

    beforeEach(async () => {
      jest.clearAllMocks();
      bluevery = new Bluevery({
        BlueveryCore: core,
        BlueveryState,
        blueveryListeners: new BlueveryListeners(),
        store: proxy({bluevery: createInitialState()}),
      });
      await bluevery.init();
    });

    describe('connect: check calls', () => {
      beforeEach(async () => {
        await bluevery.connect({
          retrieveServicesParams: ['1'],
          connectParams: ['1'],
          bondingParams: ['1', 'test'],
        });
      });

      test('should call core#connect', async () => {
        expect(connectFn).toBeCalled();
      });
    });
  });

  describe('receiveCharacteristicValue', () => {
    const connectFn = jest.fn();
    const mockedOnCallBeforeStartNotification = jest.fn(async () => {});
    let startScanFn = jest.fn();
    let spiedStartNotification: jest.SpyInstance;

    beforeEach(async () => {
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
        store: proxy({bluevery: createInitialState()}),
      });
      await bluevery.init();
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
          startNotificationParams: ['1', 'test', 'test'],
          receiveCharacteristicHandler: () => {},
          onCallBeforeStartNotification: mockedOnCallBeforeStartNotification,
        });
      });
      test('should call startScan', async () => {
        expect(startScanFn).toBeCalled();
      });
      test('should call startNotification', async () => {
        expect(spiedStartNotification).toBeCalled();
      });
      test('should call onCallBeforeStartNotification before startNotifiocation', () => {
        expect(mockedOnCallBeforeStartNotification).toHaveBeenCalledBefore(
          // @ts-expect-error spyOnとMockの型違いを言われるがランタイムで動くのでignore
          spiedStartNotification,
        );
      });
    });
  });

  describe('stopReceiveCharacteristicValue', () => {
    const stopNotificationFn = jest.fn();
    const core = (jest.fn().mockImplementation(() => ({
      listeners: {publicListeners: {}},
      init: jest.fn(),
      stopNotification: stopNotificationFn,
    })) as unknown) as typeof BlueveryCore;

    beforeEach(async () => {
      jest.clearAllMocks();
      bluevery = new Bluevery({
        BlueveryCore: core,
        BlueveryState,
        blueveryListeners: new BlueveryListeners(),
        store: proxy({bluevery: createInitialState()}),
      });
      await bluevery.init();
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
