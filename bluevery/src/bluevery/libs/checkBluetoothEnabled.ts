import BleManager from 'react-native-ble-manager';
import {NativeModules, NativeEventEmitter} from 'react-native';
import promiseRetry from 'p-retry';

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
        if (state === 'unknown') {
          reject(new Error(state));
        }
        resolve(state);
      },
    );
    BleManager.checkState();
  });
};

export async function checkBluetoothEnabled(): Promise<boolean> {
  const powerState: BluetoothPowerState = await promiseRetry(
    getBluetoothPowerState,
    {
      retries: 5,
      onFailedAttempt: (error) => {
        console.log(
          `getBluetoothPowerState failed: ${error.attemptNumber}, rest of ${error.retriesLeft}`,
        );
      },
    },
  ).catch(
    (): BluetoothPowerState => {
      return 'unknown';
    },
  );
  if (powerState === 'on') {
    return true;
  } else {
    return false;
  }
}
