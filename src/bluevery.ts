import {Peripheral} from 'react-native-ble-manager';
import promiseInterval from 'interval-promise';
import autoBind from 'auto-bind';
import {BlueveryCore as _BlueveryCore} from './blueveryCore';
import {BlueveryState as _BlueveryState} from './blueveryState';
import {BlueveryListeners as _BlueveryListeners} from './blueveryListeners';
import {
  BleManagerParams,
  BlueveryOptions,
  PeripheralInfo,
  Store,
  PublicHandlers,
  BlueveryMethodOptions,
} from './interface';
import {
  enableToDebug,
  debugBluevery,
  applyOmoiyari,
  createBlueveryCoreMethodOption,
} from './utils';
import {DEFAULT_OMOIYARI_TIME} from './constants';

type __ConstructorsAndInstances__ = {
  BlueveryCore: typeof _BlueveryCore;
  BlueveryState: typeof _BlueveryState;
  blueveryListeners: InstanceType<typeof _BlueveryListeners>;
  store: Store;
};
type ConstructorArgs = __ConstructorsAndInstances__;

export class Bluevery {
  private __constructorsAndInstances__: __ConstructorsAndInstances__;
  private __DO_NOT_DIRECT_USE_STORE__: Store;
  private core: _BlueveryCore | undefined;

  constructor({
    BlueveryCore,
    BlueveryState,
    blueveryListeners,
    store,
  }: ConstructorArgs) {
    this.__constructorsAndInstances__ = {
      BlueveryCore,
      BlueveryState,
      blueveryListeners,
      store,
    };
    this.__DO_NOT_DIRECT_USE_STORE__ = store;

    autoBind(this);
  }

  private initialized: boolean = false;
  private isStopScanInterval: boolean = false;

  /**
   * ↓ Primitive APIs
   */

  checkIsInitialized(): boolean {
    return this.initialized;
  }

  /**;
   * Force stop Bluevery's operation completely.
   * TODO: more implements
   */
  async stopBluevery() {
    debugBluevery('stopBluevery: start');
    await this.core?.stop?.();
    debugBluevery('stopBluevery: end');
  }

  /**
   * ↓ Commands API
   */

  async init(blueveryOptions?: BlueveryOptions) {
    enableToDebug(blueveryOptions?.__DEBUG);
    debugBluevery('init: start', blueveryOptions);
    if (this.checkIsInitialized()) {
      return;
    }
    const {
      BlueveryCore,
      BlueveryState,
      blueveryListeners,
    } = this.__constructorsAndInstances__;
    this.core = new BlueveryCore({
      BlueveryState,
      blueveryListeners,
      store: this.__DO_NOT_DIRECT_USE_STORE__,
      initialState: blueveryOptions?.initialState,
      onChangeStateHandler: blueveryOptions?.onChangeStateHandler,
    });

    await this.core.init(blueveryOptions);
    this.initialized = true;
    debugBluevery('init: end', this.initialized);
  }

  async startScan({
    omoiyariTime = DEFAULT_OMOIYARI_TIME,
    scanOptions,
    discoverHandler,
    matchFn,
  }: {
    omoiyariTime?: number;
    scanOptions?: BlueveryMethodOptions['scan'];
    discoverHandler?: (peripheralInfo: PeripheralInfo) => any;
    matchFn?: (peripheral: Peripheral) => boolean;
  }) {
    const {
      scanningSettings,
      intervalLength,
      iterations,
    } = createBlueveryCoreMethodOption('scan', scanOptions);

    const intervalScan = () =>
      promiseInterval(
        async (intervalCount, stopInterval) => {
          debugBluevery(`startScan: scan interval count: ${intervalCount}`);
          if (this.isStopScanInterval === true) {
            debugBluevery(`startScan: stop scan interval`);
            stopInterval();
            return; // stop immediate
          }
          debugBluevery('startScan: ordered a scan to core');
          await this.core?.scan({
            scanningSettings,
            discoverHandler,
            matchFn,
          });
          debugBluevery('startScan: core scan finished');
        },
        intervalLength,
        {iterations: iterations},
      );
    const omoiyariIntervalScan = applyOmoiyari(intervalScan, {
      time: omoiyariTime,
    });

    // Initialize the list before scan
    this.core?.clearScannedPeripherals();
    // Initialize the stop interval flag before scan
    this.isStopScanInterval = false;
    await omoiyariIntervalScan();
    debugBluevery('startScan: scan interval finished');
  }

  async stopScan() {
    debugBluevery('stopScan: start');
    // tell the interval function
    this.isStopScanInterval = true;
    await this.core?.cleanupScan();
    debugBluevery('stopScan: end');
  }

  async connect({
    omoiyariTime = DEFAULT_OMOIYARI_TIME,
    connectParams,
    connectOptions,
    bondingParams,
    bondingOptions,
    retrieveServicesParams,
    retrieveServicesOptions,
  }: {
    omoiyariTime?: number;
    connectParams: BleManagerParams['connect'];
    /**
     * @description connect must have timeout
     * @default timeoutMilliseconds = 8000ms
     */
    connectOptions?: BlueveryMethodOptions['connect'];
    retrieveServicesParams: BleManagerParams['retrieveServices'];
    /**
     * @description retrieveServices must have timeout
     * @default timeoutMilliseconds = 5000ms
     */
    retrieveServicesOptions?: BlueveryMethodOptions['retrieveServices'];
    /**
     * @description [Android only]
     */
    bondingParams: BleManagerParams['createBond'];
    /**
     * @description bonding must have timeout
     * @default timeoutMilliseconds = 10000ms
     */
    bondingOptions?: BlueveryMethodOptions['createBond'];
  }) {
    debugBluevery('connect: start');

    const _connectOptions = createBlueveryCoreMethodOption(
      'connect',
      connectOptions,
    );

    const _retrieveServicesOptions = createBlueveryCoreMethodOption(
      'retrieveServices',
      retrieveServicesOptions,
    );

    const _bondingOptions = createBlueveryCoreMethodOption(
      'createBond',
      bondingOptions,
    );

    if (this.core?.connect === undefined) {
      throw new Error('this.core?.connect is undefined');
    }
    const omoiyariConnect = applyOmoiyari(this.core?.connect, {
      time: omoiyariTime,
    });
    await omoiyariConnect({
      connectParams,
      connectOptions: _connectOptions,
      bondingParams,
      bondingOptions: _bondingOptions,
      retrieveServicesParams,
      retrieveServicesOptions: _retrieveServicesOptions,
    });
    debugBluevery('connect: end');
  }

  async disconnect({
    disconnectParams,
    disconnectOptions,
  }: {
    disconnectParams: BleManagerParams['disconnect'];
    disconnectOptions?: BlueveryMethodOptions['disconnect'];
  }) {
    debugBluevery('disconnect: start');

    const _disconnectOptions = createBlueveryMethodOption(
      'disconnect',
      disconnectOptions,
    );

    if (this.core?.disconnect === undefined) {
      throw new Error('this.core?.disconnect is undefined');
    }

    await this.core?.disconnect({
      disconnectParams,
      disconnectOptions: _disconnectOptions,
    });
    debugBluevery('disconnect: end');
  }

  /**
   * NOTE: connect, bondingはconnectメソッドで必要で、connectメソッド側でオプションのデフォルト値は吸収しているのでこのメソッドで設定しないのは意図的。
   */
  async receiveCharacteristicValue({
    scanParams,
    retrieveServicesParams,
    retrieveServicesOptions,
    onCallBeforeStartNotification,
    startNotificationParams,
    receiveCharacteristicHandler,
  }: {
    scanParams: Parameters<InstanceType<typeof Bluevery>['startScan']>[0];
    retrieveServicesParams: BleManagerParams['retrieveServices'];
    /**
     * @description retrieveServices must have timeout
     * @default timeoutMilliseconds = 5000ms
     */
    retrieveServicesOptions?: BlueveryMethodOptions['retrieveServices'];
    /**
     * @description Some peripherals may require preprocessing with startNotifiocaion. This is useful in such cases. Please refer to the "example app".
     */
    onCallBeforeStartNotification?: () => unknown | Promise<unknown>;
    startNotificationParams: BleManagerParams['startNotification'];
    receiveCharacteristicHandler: PublicHandlers['HandleDidUpdateValueForCharacteristic'];
  }) {
    debugBluevery('receiveCharacteristicValue: start');

    const [targetPeripheralId] = startNotificationParams;

    // Note: retrieveServicesがpendingのままになるときがあるので、タイムアウトするようにする
    const _retrieveServicesOptions = createBlueveryCoreMethodOption(
      'retrieveServices',
      retrieveServicesOptions,
    );

    do {
      debugBluevery('receiveCharacteristicValue: do startScan');
      await this.startScan(scanParams);
      debugBluevery(
        'receiveCharacteristicValue: end startScan',
        this.core?.getState().scannedPeripherals[targetPeripheralId],
      );
    } while (
      // receive対象のperipheralが見つからなければdoし続ける(見つかるまでscanを繰り返す)
      this.core?.getState().scannedPeripherals[targetPeripheralId] === undefined
    );

    if (onCallBeforeStartNotification) {
      debugBluevery(
        'receiveCharacteristicValue: onCallBeforeStartNotification: ',
        onCallBeforeStartNotification.name,
      );
      await onCallBeforeStartNotification();
    }

    debugBluevery(
      'receiveCharacteristicValue: ordered a startNotification to core',
    );
    await this.core?.startNotification({
      startNotificationParams,
      receiveCharacteristicHandler,
      retrieveServicesParams,
      retrieveServicesOptions: _retrieveServicesOptions,
    });
    debugBluevery('receiveCharacteristicValue: core startNotification end');
  }

  async stopReceiveCharacteristicValue({
    stopNotificationParams,
  }: {
    stopNotificationParams: BleManagerParams['stopNotification'];
  }) {
    debugBluevery(
      'stopReceiveCharacteristicValue: ordered stopNotification to core',
    );
    return await this.core?.stopNotification({stopNotificationParams});
  }

  async readValue({
    omoiyariTime = DEFAULT_OMOIYARI_TIME,
    readValueParams,
    readValueOptions,
    retrieveServicesParams,
    retrieveServicesOptions,
  }: {
    omoiyariTime?: number;
    readValueParams: BleManagerParams['read'];
    readValueOptions?: BlueveryMethodOptions['read'];
    retrieveServicesParams: BleManagerParams['retrieveServices'];
    /**
     * @description retrieveServices must have timeout
     * @default timeoutMilliseconds = 5000ms
     */
    retrieveServicesOptions?: BlueveryMethodOptions['retrieveServices'];
  }) {
    const _readValueOptions = createBlueveryCoreMethodOption(
      'read',
      readValueOptions,
    );

    const _retrieveServicesOptions = createBlueveryCoreMethodOption(
      'retrieveServices',
      retrieveServicesOptions,
    );

    if (this.core?.readValue === undefined) {
      throw new Error('this.core?.readValue is undefined');
    }

    debugBluevery('readValue: ordered readValue to core');
    const omoiyariReadValue = applyOmoiyari(this.core?.readValue, {
      time: omoiyariTime,
    });
    return await omoiyariReadValue({
      readValueParams,
      readValueOptions: _readValueOptions,
      retrieveServicesParams,
      retrieveServicesOptions: _retrieveServicesOptions,
    });
  }

  async writeValue({
    omoiyariTime = DEFAULT_OMOIYARI_TIME,
    writeValueParams,
    writeValueOptions,
    retrieveServicesParams,
    retrieveServicesOptions,
  }: {
    omoiyariTime?: number;
    writeValueParams: BleManagerParams['write'];
    writeValueOptions?: BlueveryMethodOptions['write'];
    retrieveServicesParams: BleManagerParams['retrieveServices'];
    /**
     * @description retrieveServices must have timeout
     * @default timeoutMilliseconds = 5000ms
     */
    retrieveServicesOptions?: BlueveryMethodOptions['retrieveServices'];
  }) {
    const _writeValueoptions = createBlueveryCoreMethodOption(
      'write',
      writeValueOptions,
    );

    const _retrieveServicesOptions = createBlueveryCoreMethodOption(
      'retrieveServices',
      retrieveServicesOptions,
    );

    if (this.core?.writeValue === undefined) {
      throw new Error('this.core?.writeValue is undefined');
    }

    debugBluevery('writeValue: ordered writeValue to core');
    const omoiyariWriteValue = applyOmoiyari(this.core.writeValue, {
      time: omoiyariTime,
    });
    return await omoiyariWriteValue({
      writeValueParams,
      writeValueOptions: _writeValueoptions,
      retrieveServicesParams,
      retrieveServicesOptions: _retrieveServicesOptions,
    });
  }
}
