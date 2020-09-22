import {BlueveryCore} from './blueveryCore';
import {BlueveryOptions} from './interface';

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

  scan = () => {
    return {
      connected: [],
      discovered: [],
    };
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
