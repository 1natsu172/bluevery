import {Peripheral} from 'react-native-ble-manager';
import promiseInterval from 'interval-promise';
import {BlueveryCore} from './blueveryCore';
import {
  BlueveryOptions,
  Listeners,
  PeripheralInfo,
  ScanningSettings,
} from './interface';

export class Bluevery extends BlueveryCore {
  listeners: Listeners;

  constructor() {
    super();
    this.listeners = {stateListener: this.stateEmitter};
  }

  #initialized: boolean = false;

  init = (blueveryOptions?: BlueveryOptions) => {
    if (this.#initialized) {
      throw Error('bluevery is already initialized.');
    }
    if (blueveryOptions) {
      this.setUserDefinedOptions(blueveryOptions);
    }
    this.#initialized = true;
  };

  checkIsInitialized = (): boolean => {
    return this.#initialized;
  };

  forceCheckState = () => {
    this.emitState();
  };

  startScan = async ({
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
  }) => {
    const {scanningSettings, intervalLength = 0, iterations = 1} = scanOptions;

    await promiseInterval(
      async () => {
        await this.scan({
          scanningSettings,
          discoverHandler,
          matchFn,
        });
      },
      intervalLength,
      {iterations: iterations},
    );
  };

  connect = () => {
    return {
      isConnecting: true,
    };
  };

  receiveCharacteristicValue = () => {
    return {
      rawData: [],
    };
  };
}
