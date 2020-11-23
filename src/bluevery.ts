import {Peripheral} from 'react-native-ble-manager';
import promiseInterval from 'interval-promise';
import autoBind from 'auto-bind';
import {BlueveryCore as _BlueveryCore} from './blueveryCore';
import {BlueveryState as _BlueveryState} from './blueveryState';
import {
  BlueveryOptions,
  Listeners,
  PeripheralInfo,
  ScanningSettings,
} from './interface';
import {applyOmoiyari} from './libs';
import {DEFAULT_OMOIYARI_TIME} from './utils/constants';

type ConstructorArgs = {
  BlueveryCore: typeof _BlueveryCore;
  BlueveryState: typeof _BlueveryState;
};

export class Bluevery {
  #core: _BlueveryCore;
  listeners: Listeners;

  constructor({BlueveryCore, BlueveryState}: ConstructorArgs) {
    this.#core = new BlueveryCore({BlueveryState});
    this.listeners = {stateListener: this.#core.stateEmitter};
    autoBind(this);
  }

  #initialized: boolean = false;

  /**
   * ↓ Primitive APIs
   */

  checkIsInitialized(): boolean {
    return this.#initialized;
  }

  forceCheckState() {
    this.#core.emitState();
  }

  /**;
   * Force stop Bluevery's operation completely.
   */
  stopBluevery() {}

  /**
   * ↓ Commands API
   */

  init(blueveryOptions?: BlueveryOptions) {
    if (this.checkIsInitialized()) {
      return;
    }
    if (blueveryOptions) {
      this.#core.setUserDefinedOptions(blueveryOptions);
    }
    this.#initialized = true;
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
          await this.#core.scan({
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
    await omoiyariIntervalScan();
  }

  connect() {
    return {
      isConnecting: true,
    };
  }

  receiveCharacteristicValue() {
    return {
      rawData: [],
    };
  }
}
