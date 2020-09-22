import BleManager from 'react-native-ble-manager';
import {BlueveryCore} from './blueveryCore';
import {BlueveryOptions, PeripheralInfo} from './interface';

export class Bluevery extends BlueveryCore {
  constructor() {
    super();
  }

  #initialized: boolean = false;

  init = (blueveryOptions?: BlueveryOptions) => {
    if (this.#initialized) {
      throw Error('bluevery is already initialized.');
    }
    if (blueveryOptions) {
      super.setUserDefinedOptions(blueveryOptions);
    }
  };

  startScan = async ({
    scanOptions,
    discoverHandler,
  }: {
    scanOptions: Parameters<typeof BleManager.scan>;
    discoverHandler?: (peripheralInfo: PeripheralInfo) => any;
  }) => {
    await super.scan({scanOptions, discoverHandler});
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
