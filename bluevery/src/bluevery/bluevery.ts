import BleManager, {Peripheral} from 'react-native-ble-manager';
import {BlueveryCore} from './blueveryCore';
import {BlueveryOptions, PeripheralInfo} from './interface';

export class Bluevery extends BlueveryCore {
  addListener = this.emitter.on;

  constructor() {
    super();
  }

  #initialized: boolean = false;

  init = (blueveryOptions?: BlueveryOptions) => {
    if (this.#initialized) {
      throw Error('bluevery is already initialized.');
    }
    if (blueveryOptions) {
      this.setUserDefinedOptions(blueveryOptions);
    }
  };

  startScan = async ({
    scanOptions,
    discoverHandler,
    matchFn,
  }: {
    scanOptions: Parameters<typeof BleManager.scan>;
    discoverHandler?: (peripheralInfo: PeripheralInfo) => any;
    matchFn?: (peripheral: Peripheral) => boolean;
  }) => {
    await this.scan({scanOptions, discoverHandler, matchFn});
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
