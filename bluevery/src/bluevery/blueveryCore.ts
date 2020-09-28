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
import {BlueveryOptions, PeripheralInfo, State} from './interface';
import {
  checkBluetoothEnabled,
  checkPermission,
  handleDiscoverPeripheral,
  requestPermission,
} from './libs';
import {BlueveryState} from './blueVeryState';
import {EventEmitter} from 'events';
import onChange from 'on-change';

const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

export class BlueveryCore {
  constructor() {
    this.emitter = new EventEmitter();
    this.#state = new BlueveryState({
      onChangeStateHandler: this.#onChangeCoreState,
    });
  }

  #userDefinedOptions: BlueveryOptions = {};
  #state: BlueveryState;

  emitter: EventEmitter;

  /**
   * @property listeners
   */
  #discoverPeripheralListener?: EmitterSubscription;

  setUserDefinedOptions = (options: BlueveryOptions) => {
    this.#userDefinedOptions = options;
  };

  #onChangeCoreState = (
    ..._args: Parameters<Parameters<typeof onChange>[1]>
  ) => {
    this.emitter.emit('didChangeBlueveryState', this);
  };

  #getState = (): Readonly<State> => {
    return this.#state.getState();
  };

  #requireCheckBeforeBleProcess = async () => {
    const isEnableBluetooth = await this.#checkBluetoothEnabled();
    if (!isEnableBluetooth) {
      throw new Error('bluetooth is not enabled.');
    }
    const [, requestedThenGranted] = await this.#checkAndRequestPermission();
    if (requestedThenGranted) {
      throw new Error(
        `need these permission: ${JSON.stringify(requestPermission)}`,
      );
    }

    /**
     * initialize managing
     */
    this.#managing();
  };

  #checkBluetoothEnabled = async () => {
    const isEnabled = await checkBluetoothEnabled();
    if (isEnabled) {
      this.#state.setBluetoothEnabled();
    } else {
      this.#state.setBluetoothDisabled();
    }
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
    if (this.#getState().managing === false) {
      await BleManager.start().then(() => {
        this.#state.onManaging();
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
    if (!this.#getState().scanning) {
      await this.#requireCheckBeforeBleProcess();
      await BleManager.scan(...scanOptions);

      this.#discoverPeripheralListener = bleManagerEmitter.addListener(
        'BleManagerDiscoverPeripheral',
        (peripheral: Peripheral) => {
          handleDiscoverPeripheral(peripheral, (peripheralInfo) => {
            // set peripheral to state.
            this.#state.setPeripheralToState(peripheralInfo);
            // call passed handler by user.
            discoverHandler && discoverHandler(peripheralInfo);
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
