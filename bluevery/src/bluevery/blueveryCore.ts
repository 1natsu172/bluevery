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
import {eventmit, Eventmitter} from 'eventmit';
import delay from 'delay';
import {
  BlueveryOptions,
  PeripheralInfo,
  ScanningSettings,
  State,
} from './interface';
import {
  checkBluetoothEnabled,
  checkPermission,
  handleDiscoverPeripheral,
  requestPermission,
} from './libs';
import {BlueveryState} from './blueVeryState';

const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

export class BlueveryCore {
  #userDefinedOptions: BlueveryOptions = {};
  #state: BlueveryState;
  emitter: Eventmitter<State>;

  constructor() {
    this.emitter = eventmit<State>();
    this.#state = new BlueveryState({
      onChangeStateHandler: this.#onChangeCoreState,
    });
  }

  /**
   * @property listeners
   */
  #discoverPeripheralListener?: EmitterSubscription;

  setUserDefinedOptions = (options: BlueveryOptions) => {
    this.#userDefinedOptions = options;
  };

  #onChangeCoreState = (..._args: unknown[]) => {
    this.emitter.emit(this.#getState());
  };

  #getState = (): Readonly<State> => {
    return this.#state.getState();
  };

  #requireCheckBeforeBleProcess = async () => {
    /**
     * initialize managing
     */
    this.#managing();

    const [, requestedThenGranted] = await this.#checkAndRequestPermission();
    if (requestedThenGranted) {
      throw new Error(
        `need these permission: ${JSON.stringify(requestPermission)}`,
      );
    }

    const isEnableBluetooth = await this.#checkBluetoothEnabled();
    if (!isEnableBluetooth) {
      throw new Error('bluetooth is not enabled.');
    }
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
    scanningSettings,
    discoverHandler,
    matchFn,
  }: {
    scanningSettings: ScanningSettings;
    discoverHandler?: (peripheralInfo: PeripheralInfo) => any;
    matchFn?: (peripheral: Peripheral) => boolean;
  }) => {
    if (!this.#getState().scanning) {
      await this.#requireCheckBeforeBleProcess();

      this.#state.onScanning();

      const [, discoverPeripheralListener] = await Promise.all([
        // scan開始
        await BleManager.scan(...scanningSettings).catch((err) =>
          console.warn(err),
        ),
        // discover処理を登録
        bleManagerEmitter.addListener(
          'BleManagerDiscoverPeripheral',
          (peripheral: Peripheral) => {
            if (matchFn && !matchFn(peripheral)) {
              return;
            }
            handleDiscoverPeripheral(peripheral, (peripheralInfo) => {
              // set peripheral to state.
              this.#state.setPeripheralToState(peripheralInfo);
              // call passed handler by user.
              discoverHandler && discoverHandler(peripheralInfo);
            });
          },
        ),
      ]);
      this.#discoverPeripheralListener = discoverPeripheralListener;

      // スキャン秒数経ったらscan処理を終える
      const [, scanSeconds] = scanningSettings;
      await delay(scanSeconds * 1000).then(this.#cleanupScan);
    }
  };

  #cleanupScan = () => {
    return Promise.all([
      BleManager.stopScan(),
      this.#discoverPeripheralListener?.remove(),
      this.#state.offScanning(),
    ]);
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
