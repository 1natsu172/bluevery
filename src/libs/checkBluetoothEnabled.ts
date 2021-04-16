import BleManager from 'react-native-ble-manager';
import {NativeModules, NativeEventEmitter} from 'react-native';
import {toBetterPromise, ToBetterOptions} from '../utils/toBetterPromise';

const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

type BluetoothPowerState = 'on' | 'off' | 'unknown';

export const getBluetoothPowerState = async (): Promise<
  BluetoothPowerState
> => {
  return new Promise((resolve, reject) => {
    const listener = bleManagerEmitter.addListener(
      'BleManagerDidUpdateState',
      ({state}: {state: BluetoothPowerState}) => {
        listener.remove();
        if (state === 'on' || state === 'off') {
          resolve(state);
        } else {
          reject(new Error(state));
        }
      },
    );
    BleManager.checkState();
  });
};

export async function checkBluetoothEnabled(
  betterOptions: ToBetterOptions = {retryOptions: {factor: 1, retries: 5}},
): Promise<boolean> {
  const getPowerState = toBetterPromise(getBluetoothPowerState, betterOptions);
  const powerState: BluetoothPowerState = await getPowerState().catch(
    (error: BluetoothPowerState): BluetoothPowerState => {
      return error;
    },
  );
  if (powerState === 'on') {
    return true;
  } else {
    return false;
  }
}
