import {PeripheralInfo} from 'bluevery';

export type BleController = {
  onConnectPeripheral: (peripheralInfo: PeripheralInfo) => Promise<void>;
  characteristicValues: {
    [x: string]: unknown[] | undefined;
  };
  receiveCharacteristicValueHandlers:
    | undefined
    | {
        [x: string]:
          | {
              name: string;
              onReceiveCharacteristicValue: (
                peripheralInfo: PeripheralInfo,
              ) => Promise<void>;
            }
          | undefined;
      };
};
