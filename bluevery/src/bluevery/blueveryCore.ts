import {
  NativeModules,
  NativeEventEmitter,
  EmitterSubscription,
} from 'react-native';
import BleManager, {Peripheral} from 'react-native-ble-manager';
import {Permission} from 'react-native-permissions';
import promiseRetry from 'p-retry';
import promiseTimeout from 'p-timeout';
import wait from 'delay';
import {BlueveryOptions, CoreState, PeripheralInfo} from './interface';
import {
  checkBluetoothEnabled,
  checkPermission,
  handleDiscoverPeripheral,
  requestPermission,
} from './libs';

const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

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

  /**
   * @property listeners
   */
  #discoverPeripheralListener?: EmitterSubscription;

  setUserDefinedOptions = (options: BlueveryOptions) => {
    this.#userDefinedOptions = options;
  };

  #setPeripheralToState = (peripheralInfo: PeripheralInfo) => {
    this.#coreState.peripherals.set(peripheralInfo.id, peripheralInfo);
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

  scan = async ({
    scanOptions,
    discoverHandler,
  }: {
    scanOptions: Parameters<typeof BleManager.scan>;
    discoverHandler?: (peripheralInfo: PeripheralInfo) => any;
  }) => {
    if (!this.#coreState.scanning) {
      await BleManager.scan(...scanOptions);

      this.#discoverPeripheralListener = bleManagerEmitter.addListener(
        'BleManagerDiscoverPeripheral',
        (peripheral: Peripheral) => {
          handleDiscoverPeripheral(peripheral, (peripheralInfo) => {
            // call passed handler by user.
            discoverHandler && discoverHandler(peripheralInfo);
            // set peripheral to coreState.
            this.#setPeripheralToState(peripheralInfo);
          });
        },
      );
    }
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
