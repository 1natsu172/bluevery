import {Peripheral} from 'react-native-ble-manager';
import promiseInterval from 'interval-promise';
import autoBind from 'auto-bind';
import {BlueveryCore as _BlueveryCore} from './blueveryCore';
import {BlueveryState as _BlueveryState} from './blueveryState';
import {
  BlueveryOptions,
  PeripheralInfo,
  ScanningSettings,
  StartNotificationParams,
  State,
} from './interface';
import {
  BondingParams,
  ConnectParams,
  ReadValueParams,
  RetrieveServicesParams,
  WriteValueParams,
} from './libs';
import {applyOmoiyari} from './utils';
import {DEFAULT_OMOIYARI_TIME} from './constants';

type ConstructorArgs = {
  BlueveryCore: typeof _BlueveryCore;
  BlueveryState: typeof _BlueveryState;
};

export class Bluevery {
  private core: _BlueveryCore;
  private __DO_NOT_DIRECT_USE_STATE__: State;

  constructor({BlueveryCore, BlueveryState}: ConstructorArgs) {
    this.core = new BlueveryCore({BlueveryState});
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
      scanningSettings: ScanningSettings;
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
    bondingParams,
    retrieveServicesParams,
  }: {
    connectParams: ConnectParams;
    retrieveServicesParams: RetrieveServicesParams;
    bondingParams: BondingParams;
  }) {
    await this.core.connect({
      connectParams,
      bondingParams,
      retrieveServicesParams,
    });
  }

  async connectAndCheckCommunicate({
    connectParams,
    bondingParams,
    retrieveServicesParams,
    readValueParams,
    writeValueParams,
  }: {
    connectParams: ConnectParams;
    retrieveServicesParams: RetrieveServicesParams;
    bondingParams: BondingParams;
    writeValueParams: WriteValueParams;
    readValueParams: ReadValueParams;
  }) {
    await this.core.connect({
      connectParams,
      bondingParams,
      retrieveServicesParams,
    });
    await this.core.checkCommunicateWithPeripheral({
      readValueParams,
      writeValueParams,
    });
  }

  // FIXME: conditional typeにする
  async receiveCharacteristicValue({
    scanParams,
    startNotificationParams,
    connectParams,
    retrieveServicesParams,
    bondingParams,
    writeValueParams,
    readValueParams,
    checkCommunicate = true,
  }: {
    scanParams: Parameters<InstanceType<typeof Bluevery>['startScan']>[0];
    startNotificationParams: StartNotificationParams;
    connectParams: ConnectParams;
    retrieveServicesParams: RetrieveServicesParams;
    bondingParams: BondingParams;
    writeValueParams: WriteValueParams;
    readValueParams: ReadValueParams;
    checkCommunicate?: boolean;
  }) {
    const [targetPeripheralId] = connectParams.connectParams;

    do {
      await this.startScan(scanParams);
    } while (
      // receive対象のperipheralが見つからなければdoし続ける(見つかるまでscanを繰り返す)
      this.core.getState().scannedPeripherals[targetPeripheralId] === undefined
    );

    if (checkCommunicate) {
      await this.connectAndCheckCommunicate({
        connectParams,
        bondingParams,
        readValueParams,
        retrieveServicesParams,
        writeValueParams,
      });
    } else {
      await this.connect({
        connectParams,
        bondingParams,
        retrieveServicesParams,
      });
    }
    await this.core.startNotification({startNotificationParams});
  }

  async readValue() {}

  async writeValue() {}
}
