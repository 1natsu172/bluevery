import BleManager from 'react-native-ble-manager';
import {NativeModules, NativeEventEmitter} from 'react-native';

const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

type BluetoothPowerState = 'on' | 'off' | 'unknown';

export const getBluetoothPowerState = async (): Promise<
  BluetoothPowerState
> => {
  return new Promise((resolve, _reject) => {
    const listener = bleManagerEmitter.addListener(
      'BleManagerDidUpdateState',
      ({state}: {state: BluetoothPowerState}) => {
        listener.remove();
        resolve(state);
      },
    );
    BleManager.checkState();
  });
};

export async function checkBluetoothEnabled(): Promise<boolean> {
  const powerState = await getBluetoothPowerState();
  if (powerState === 'on') {
    return true;
  } else {
    return false;
  }
}
