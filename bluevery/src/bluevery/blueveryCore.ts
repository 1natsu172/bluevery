import {Platform} from 'react-native';
import BleManager from 'react-native-ble-manager';
import {Permission} from 'react-native-permissions';
import promiseRetry from 'p-retry';
import promiseTimeout from 'p-timeout';
import wait from 'delay';
import {BlueveryOptions, CoreState} from './interface';
import {
  checkBluetoothEnabled,
  checkPermission,
  requestPermission,
} from './libs';

export class BlueveryCore {
  constructor() {}

  #userDefinedOptions: BlueveryOptions = {};
  #coreState: CoreState = {
    bluetoothEnabled: false,
    permissionGranted: false,
    managing: false,
    connecting: false,
    scanning: false,
    error: undefined,
    peripherals: new Map(),
    // notificationListeners: any[],
  };

  setUserDefinedOptions = (options: BlueveryOptions) => {
    this.#userDefinedOptions = options;
  };

  #checkBluetoothEnabled = async () => {
    const isEnabled = await checkBluetoothEnabled();
    this.#coreState.bluetoothEnabled = isEnabled;
    return isEnabled;
  };

  #checkAndRequestPermission = async (): Promise<
    [granted: Permission[], requestedThenGranted?: Permission[]]
  > => {
    const [granted, ungranted] = await checkPermission();
    if (ungranted.length) {
      const [
        requestedThenGranted,
        requestedButUngranted,
      ] = await requestPermission(ungranted);
      if (requestedButUngranted) {
        throw new Error(JSON.stringify(requestedButUngranted));
      }
      return [granted, requestedThenGranted];
    }
    return [granted];
  };

  #managing = async () => {
    if (this.#coreState.managing === false) {
      await BleManager.start().then(() => {
        this.#coreState.managing = true;
      });
    }
  };

  #scan = async (...args: Parameters<typeof BleManager.scan>) => {
    await BleManager.scan(...args);
  };

  #connect = async (...args: Parameters<typeof BleManager.connect>) => {
    await BleManager.connect(...args);
  };

  #discoverHandler = () => {};

  #startNotification = async (
    ...args: Parameters<typeof BleManager.startNotification>
  ) => {
    await BleManager.startNotification(...args);
  };

  stopNotification = async (
    ...args: Parameters<typeof BleManager.stopNotification>
  ) => {
    await BleManager.stopNotification(...args);
  };
}
