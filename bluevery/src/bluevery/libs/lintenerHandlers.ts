import {Peripheral} from 'react-native-ble-manager';
import {PeripheralInfo} from '../interface';

export const handleDiscoverPeripheral = (
  peripheral: Peripheral,
  callback: (peripheralInfo: PeripheralInfo) => unknown,
) => {
  console.log('Got ble peripheral', peripheral);

  const peripheralInfo: PeripheralInfo = peripheral;
  if (!peripheralInfo.name) {
    peripheralInfo.name = 'NO NAME';
  }
  callback(peripheralInfo);
};
