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
  State,
  PublicHandlers,
} from './interface';
import {applyOmoiyari, ToBetterOptions} from './utils';
import {DEFAULT_OMOIYARI_TIME} from './constants';

type ConstructorArgs = {
  BlueveryCore: typeof _BlueveryCore;
  BlueveryState: typeof _BlueveryState;
  blueveryListeners: InstanceType<typeof _BlueveryListeners>;
};

export class Bluevery {
  private core: _BlueveryCore;
  private __DO_NOT_DIRECT_USE_STATE__: State;

  constructor({
    BlueveryCore,
    BlueveryState,
    blueveryListeners,
  }: ConstructorArgs) {
    this.core = new BlueveryCore({BlueveryState, blueveryListeners});
    // @ts-expect-error
    this.__DO_NOT_DIRECT_USE_STATE__ = this.core.__DO_NOT_DIRECT_USE_STATE__;
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
   */
  // TODO: implements
  stopBluevery() {}

  /**
   * ↓ Commands API
   */

  async init(blueveryOptions?: BlueveryOptions) {
    if (this.checkIsInitialized()) {
      return;
    }
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
          await this.core.scan({
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
    this.core.clearScannedPeripherals();
    await omoiyariIntervalScan();
  }

  async connect({
    connectParams,
    connectOptions = {retryOptions: {factor: 1, retries: 4}},
    bondingParams,
    bondingOptions = {retryOptions: {factor: 1, retries: 4}},
    retrieveServicesParams,
    retrieveServicesOptions = {retryOptions: {factor: 1, retries: 4}},
  }: {
    connectParams: BleManagerParams['connect'];
    connectOptions?: ToBetterOptions;
    retrieveServicesParams: BleManagerParams['retrieveServices'];
    /**
     * @description retrieveServices with timeout
     * @default timeoutMilliseconds = 2000ms
     */
    retrieveServicesOptions?: ToBetterOptions;
    bondingParams: BleManagerParams['createBond'];
    bondingOptions?: ToBetterOptions;
  }) {
    await this.core.connect({
      connectParams,
      connectOptions,
      bondingParams,
      bondingOptions,
      retrieveServicesParams,
      retrieveServicesOptions,
    });
  }

  async receiveCharacteristicValue({
    scanParams,
    connectParams,
    connectOptions = {retryOptions: {factor: 1, retries: 4}},
    retrieveServicesParams,
    retrieveServicesOptions = {retryOptions: {factor: 1, retries: 4}},
    bondingParams,
    bondingOptions = {retryOptions: {factor: 1, retries: 4}},
    startNotificationParams,
    receiveCharacteristicHandler,
  }: {
    scanParams: Parameters<InstanceType<typeof Bluevery>['startScan']>[0];
    connectParams: BleManagerParams['connect'];
    connectOptions?: ToBetterOptions;
    retrieveServicesParams: BleManagerParams['retrieveServices'];
    retrieveServicesOptions?: ToBetterOptions;
    bondingParams: BleManagerParams['createBond'];
    bondingOptions?: ToBetterOptions;
    startNotificationParams: BleManagerParams['startNotification'];
    receiveCharacteristicHandler: PublicHandlers['HandleDidUpdateValueForCharacteristic'];
  }) {
    const [targetPeripheralId] = connectParams;

    do {
      await this.startScan(scanParams);
    } while (
      // receive対象のperipheralが見つからなければdoし続ける(見つかるまでscanを繰り返す)
      this.core.getState().scannedPeripherals[targetPeripheralId] === undefined
    );

    await this.connect({
      connectParams,
      connectOptions,
      bondingParams,
      bondingOptions,
      retrieveServicesParams,
      retrieveServicesOptions,
    });

    await this.core.startNotification({
      startNotificationParams,
      receiveCharacteristicHandler,
    });
  }

  async stopReceiveCharacteristicValue({
    stopNotificationParams,
  }: {
    stopNotificationParams: BleManagerParams['stopNotification'];
  }) {
    return await this.core.stopNotification({stopNotificationParams});
  }

  async readValue(
    readValueParams: BleManagerParams['read'],
    options: ToBetterOptions = {
      retryOptions: {factor: 1, retries: 4},
    },
  ) {
    return await this.core.readValue(readValueParams, options);
  }

  async writeValue(
    writeValueParams: BleManagerParams['write'],
    options: ToBetterOptions = {
      retryOptions: {factor: 1, retries: 4},
    },
  ) {
    return await this.core.writeValue(writeValueParams, options);
  }
}
