import {Peripheral} from 'react-native-ble-manager';
import promiseInterval from 'interval-promise';
import autoBind from 'auto-bind';
import deepmerge from 'deepmerge';
import {BlueveryCore as _BlueveryCore} from './blueveryCore';
import {BlueveryState as _BlueveryState} from './blueveryState';
import {BlueveryListeners as _BlueveryListeners} from './blueveryListeners';
import {
  BleManagerParams,
  BlueveryOptions,
  PeripheralInfo,
  State,
  PublicHandlers,
  PublicListeners,
} from './interface';
import {applyOmoiyari, ToBetterOptions} from './utils';
import {DEFAULT_OMOIYARI_TIME} from './constants';

type __ConstructorsAndInstances__ = {
  BlueveryCore: typeof _BlueveryCore;
  BlueveryState: typeof _BlueveryState;
  blueveryListeners: InstanceType<typeof _BlueveryListeners>;
};
type ConstructorArgs = __ConstructorsAndInstances__;

export class Bluevery {
  private __constructorsAndInstances__: __ConstructorsAndInstances__;
  private __DO_NOT_DIRECT_USE_STATE__: State | undefined;
  private core: _BlueveryCore | undefined;
  publicListeners: PublicListeners | undefined;

  constructor({
    BlueveryCore,
    BlueveryState,
    blueveryListeners,
  }: ConstructorArgs) {
    this.__constructorsAndInstances__ = {
      BlueveryCore,
      BlueveryState,
      blueveryListeners,
    };

    autoBind(this);
  }

  private initialized: boolean = false;

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
  stopBluevery() {
    this.core?.stop?.();
  }

  /**
   * ↓ Commands API
   */

  async init(blueveryOptions?: BlueveryOptions) {
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
      initialState: blueveryOptions?.initialState,
      onChangeStateHandler: blueveryOptions?.onChangeStateHandler,
    });
    this.publicListeners = this.core.listeners.publicListeners;
    // @ts-expect-error
    this.__DO_NOT_DIRECT_USE_STATE__ = this.core.__DO_NOT_DIRECT_USE_STATE__;

    await this.core.init(blueveryOptions);
    this.initialized = true;
  }

  async startScan({
    scanOptions,
    discoverHandler,
    matchFn,
  }: {
    scanOptions: {
      /**
       * @description
       * Important: The seconds setting is a second, not a millisecond!
       */
      scanningSettings: BleManagerParams['scan'];
      /**
       * @description Important: this is millisecond. interval that scan between scan. default is `0` = no interval.
       */
      intervalLength?: number;
      /**
       * @description count of interval iteration. default is `1` = only once scan.
       */
      iterations?: number;
    };
    discoverHandler?: (peripheralInfo: PeripheralInfo) => any;
    matchFn?: (peripheral: Peripheral) => boolean;
  }) {
    const {scanningSettings, intervalLength = 0, iterations = 1} = scanOptions;

    const intervalScan = () =>
      promiseInterval(
        async () => {
          await this.core?.scan({
            scanningSettings,
            discoverHandler,
            matchFn,
          });
        },
        intervalLength,
        {iterations: iterations},
      );
    const omoiyariIntervalScan = applyOmoiyari(intervalScan, {
      time: DEFAULT_OMOIYARI_TIME,
    });

    // Initialize the list before scan
    this.core?.clearScannedPeripherals();
    await omoiyariIntervalScan();
  }

  async connect({
    connectParams,
    connectOptions,
    bondingParams,
    bondingOptions,
    retrieveServicesParams,
    retrieveServicesOptions,
  }: {
    connectParams: BleManagerParams['connect'];
    /**
     * @description connect must have timeout
     * @default timeoutMilliseconds = 8000ms
     */
    connectOptions?: ToBetterOptions;
    retrieveServicesParams: BleManagerParams['retrieveServices'];
    /**
     * @description retrieveServices must have timeout
     * @default timeoutMilliseconds = 5000ms
     */
    retrieveServicesOptions?: ToBetterOptions;
    /**
     * @description [Android only]
     */
    bondingParams: BleManagerParams['createBond'];
    /**
     * @description bonding must have timeout
     * @default timeoutMilliseconds = 10000ms
     */
    bondingOptions?: ToBetterOptions;
  }) {
    // Note: connectはiOSで失敗してもタイムアウトしないので、タイムアウトするようにする
    const _connectOptions = deepmerge<ToBetterOptions>(
      {
        retryOptions: {factor: 1, retries: 4},
        timeoutOptions: {timeoutMilliseconds: 8000},
      },
      connectOptions || {},
    );
    // Note: retrieveServicesがpendingのままになるときがあるので、タイムアウトするようにする
    const _retrieveServicesOptions = deepmerge<ToBetterOptions>(
      {
        retryOptions: {factor: 1, retries: 4},
        timeoutOptions: {timeoutMilliseconds: 5000},
      },
      retrieveServicesOptions || {},
    );
    // Note: 無限にbondingして返ってこないケースがあるので、タイムアウトするようにする
    const _bondingOptions = deepmerge<ToBetterOptions>(
      {
        retryOptions: {factor: 1, retries: 4},
        timeoutOptions: {timeoutMilliseconds: 10000},
      },
      bondingOptions || {},
    );

    await this.core?.connect({
      connectParams,
      connectOptions: _connectOptions,
      bondingParams,
      bondingOptions: _bondingOptions,
      retrieveServicesParams,
      retrieveServicesOptions: _retrieveServicesOptions,
    });
  }

  /**
   * NOTE: connect, bondingはconnectメソッドで必要で、connectメソッド側でオプションのデフォルト値は吸収しているのでこのメソッドで設定しないのは意図的。
   */
  async receiveCharacteristicValue({
    scanParams,
    connectParams,
    connectOptions,
    retrieveServicesParams,
    retrieveServicesOptions,
    bondingParams,
    bondingOptions,
    startNotificationParams,
    receiveCharacteristicHandler,
  }: {
    scanParams: Parameters<InstanceType<typeof Bluevery>['startScan']>[0];
    connectParams: BleManagerParams['connect'];
    connectOptions?: ToBetterOptions;
    retrieveServicesParams: BleManagerParams['retrieveServices'];
    /**
     * @description retrieveServices must have timeout
     * @default timeoutMilliseconds = 5000ms
     */
    retrieveServicesOptions?: ToBetterOptions;
    bondingParams: BleManagerParams['createBond'];
    bondingOptions?: ToBetterOptions;
    startNotificationParams: BleManagerParams['startNotification'];
    receiveCharacteristicHandler: PublicHandlers['HandleDidUpdateValueForCharacteristic'];
  }) {
    const [targetPeripheralId] = connectParams;

    // Note: retrieveServicesがpendingのままになるときがあるので、タイムアウトするようにする
    const _retrieveServicesOptions = deepmerge<ToBetterOptions>(
      {
        retryOptions: {factor: 1, retries: 4},
        timeoutOptions: {timeoutMilliseconds: 5000},
      },
      retrieveServicesOptions || {},
    );

    do {
      await this.startScan(scanParams);
    } while (
      // receive対象のperipheralが見つからなければdoし続ける(見つかるまでscanを繰り返す)
      this.core?.getState().scannedPeripherals[targetPeripheralId] === undefined
    );

    await this.connect({
      connectParams,
      connectOptions,
      bondingParams,
      bondingOptions,
      retrieveServicesParams,
      retrieveServicesOptions,
    });

    await this.core?.startNotification({
      startNotificationParams,
      receiveCharacteristicHandler,
      retrieveServicesParams,
      retrieveServicesOptions: _retrieveServicesOptions,
    });
  }

  async stopReceiveCharacteristicValue({
    stopNotificationParams,
  }: {
    stopNotificationParams: BleManagerParams['stopNotification'];
  }) {
    return await this.core?.stopNotification({stopNotificationParams});
  }

  async readValue({
    readValueParams,
    readValueOptions,
    retrieveServicesParams,
    retrieveServicesOptions,
  }: {
    readValueParams: BleManagerParams['read'];
    readValueOptions?: ToBetterOptions;
    retrieveServicesParams: BleManagerParams['retrieveServices'];
    /**
     * @description retrieveServices must have timeout
     * @default timeoutMilliseconds = 5000ms
     */
    retrieveServicesOptions?: ToBetterOptions;
  }) {
    const _readValueOptions = deepmerge<ToBetterOptions>(
      {
        retryOptions: {factor: 1, retries: 4},
      },
      readValueOptions || {},
    );

    // Note: retrieveServicesがpendingのままになるときがあるので、タイムアウトするようにする
    const _retrieveServicesOptions = deepmerge<ToBetterOptions>(
      {
        retryOptions: {factor: 1, retries: 4},
        timeoutOptions: {timeoutMilliseconds: 5000},
      },
      retrieveServicesOptions || {},
    );

    return await this.core?.readValue({
      readValueParams,
      readValueOptions: _readValueOptions,
      retrieveServicesParams,
      retrieveServicesOptions: _retrieveServicesOptions,
    });
  }

  async writeValue({
    writeValueParams,
    writeValueOptions,
    retrieveServicesParams,
    retrieveServicesOptions,
  }: {
    writeValueParams: BleManagerParams['write'];
    writeValueOptions?: ToBetterOptions;
    retrieveServicesParams: BleManagerParams['retrieveServices'];
    /**
     * @description retrieveServices must have timeout
     * @default timeoutMilliseconds = 5000ms
     */
    retrieveServicesOptions?: ToBetterOptions;
  }) {
    const _writeValueoptions = deepmerge<ToBetterOptions>(
      {
        retryOptions: {factor: 1, retries: 4},
      },
      writeValueOptions || {},
    );
    // Note: retrieveServicesがpendingのままになるときがあるので、タイムアウトするようにする
    const _retrieveServicesOptions = deepmerge<ToBetterOptions>(
      {
        retryOptions: {factor: 1, retries: 4},
        timeoutOptions: {timeoutMilliseconds: 5000},
      },
      retrieveServicesOptions || {},
    );

    return await this.core?.writeValue({
      writeValueParams,
      writeValueOptions: _writeValueoptions,
      retrieveServicesParams,
      retrieveServicesOptions: _retrieveServicesOptions,
    });
  }
}
