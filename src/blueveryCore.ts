import {
  NativeModules,
  NativeEventEmitter,
  EmitterSubscription,
} from 'react-native';
import BleManager, {Peripheral} from 'react-native-ble-manager';
import {Permission} from 'react-native-permissions';
// import promiseRetry from 'p-retry';
// import promiseTimeout from 'p-timeout';
import {Eventmitter} from 'eventmit';
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
  registerDiscoverPeripheralListener,
  createHandleDiscoverPeripheral,
  onDiscoverPeripheral,
  createPeripheralInfoHandler,
  requestPermission,
} from './libs';
import {BlueveryState as _BlueveryState} from './blueveryState';
import autoBind from 'auto-bind';

type ConstructorArgs = {
  BlueveryState: typeof _BlueveryState;
};

const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

export class BlueveryCore {
  #userDefinedOptions: BlueveryOptions = {};
  #state: _BlueveryState;
  stateEmitter: Eventmitter<State>;

  constructor({BlueveryState}: ConstructorArgs) {
    this.#state = new BlueveryState({});
    this.stateEmitter = this.#state.stateEmitter;
    autoBind(this);
  }

  /**
   * @property listeners
   */
  #discoverPeripheralListener?: EmitterSubscription;

  setUserDefinedOptions(options: BlueveryOptions) {
    this.#userDefinedOptions = options;
  }

  emitState() {
    this.#state.emitState();
  }

  private getState(): Readonly<State> {
    return this.#state.getState();
  }

  private async requireCheckBeforeBleProcess() {
    /**
     * initialize managing
     */
    await this.managing();

    const [, , requestedButUngranted] = await this.checkAndRequestPermission();
    if (requestedButUngranted) {
      throw new Error(
        `need these permission: ${JSON.stringify(requestedButUngranted)}`,
      );
    }

    const isEnableBluetooth = await this.checkBluetoothEnabled();
    if (!isEnableBluetooth) {
      throw new Error('bluetooth is not enabled.');
    }
  }

  private async checkBluetoothEnabled() {
    const isEnabled = await checkBluetoothEnabled();
    if (isEnabled) {
      this.#state.setBluetoothEnabled();
    } else {
      this.#state.setBluetoothDisabled();
    }
    return isEnabled;
  }

  private async checkAndRequestPermission(): Promise<
    [
      granted: Permission[],
      requestedThenGranted?: Permission[],
      requestedButUngranted?: Permission[],
    ]
  > {
    const [granted, ungranted] = await checkPermission();
    if (ungranted.length) {
      const [
        requestedThenGranted,
        requestedButUngranted,
      ] = await requestPermission(ungranted);
      if (requestedButUngranted) {
        throw new Error(JSON.stringify(requestedButUngranted));
      }
      return [granted, requestedThenGranted, requestedButUngranted];
    }
    return [granted];
  }

  private async managing() {
    if (this.getState().managing === false) {
      await BleManager.start().then(() => {
        this.#state.onManaging();
      });
    }
  }

  async scan({
    scanningSettings,
    discoverHandler,
    matchFn,
  }: {
    scanningSettings: ScanningSettings;
    discoverHandler?: (peripheralInfo: PeripheralInfo) => any;
    matchFn?: (peripheral: Peripheral) => boolean;
  }) {
    if (!this.getState().scanning) {
      const peripheralInfoHandler = createPeripheralInfoHandler({
        setPeripheralToState: this.#state.setPeripheralToState,
        handlePeripheralInfo: discoverHandler,
      });
      const handleDiscoverPeripheral = createHandleDiscoverPeripheral(
        onDiscoverPeripheral,
        {
          matchFn,
          peripheralInfoHandler,
        },
      );

      await this.requireCheckBeforeBleProcess();

      this.#state.onScanning();

      const [, discoverPeripheralListener] = await Promise.all([
        // note: scan開始。promiseだがscan秒数待たないので後続処理でscan秒数を担保している
        await BleManager.scan(...scanningSettings).catch((err) =>
          console.warn(err),
        ),
        // discover処理を登録
        registerDiscoverPeripheralListener(
          bleManagerEmitter,
          handleDiscoverPeripheral,
        ),
      ]);
      this.#discoverPeripheralListener = discoverPeripheralListener;

      // note: スキャン秒数の担保。指定秒数経ったらscan処理を終える
      const [, scanSeconds] = scanningSettings;
      await delay(scanSeconds * 1000).then(this.cleanupScan);
    }
  }

  private cleanupScan() {
    return Promise.all([
      BleManager.stopScan(),
      this.#discoverPeripheralListener?.remove(),
      this.#state.offScanning(),
    ]);
  }

  private async connect(...args: Parameters<typeof BleManager.connect>) {
    await BleManager.connect(...args);
  }

  private discoverHandler() {}

  private async startNotification(
    ...args: Parameters<typeof BleManager.startNotification>
  ) {
    await BleManager.startNotification(...args);
  }

  async stopNotification(
    ...args: Parameters<typeof BleManager.stopNotification>
  ) {
    await BleManager.stopNotification(...args);
  }
}
