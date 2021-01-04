import {
  NativeModules,
  NativeEventEmitter,
  EmitterSubscription,
  Platform,
} from 'react-native';
import BleManager, {Peripheral} from 'react-native-ble-manager';
import {Permission} from 'react-native-permissions';
import promiseRetry from 'p-retry';
import promiseTimeout from 'p-timeout';
import {Eventmitter} from 'eventmit';
import delay from 'delay';
import {
  BlueveryOptions,
  PeripheralInfo,
  ScanningSettings,
  State,
  StartNotificationParams,
  StopNotificationParams,
} from './interface';
import {
  checkBluetoothEnabled,
  checkPermission,
  registerDiscoverPeripheralListener,
  createHandleDiscoverPeripheral,
  onDiscoverPeripheral,
  createPeripheralInfoHandler,
  registerDidUpdateValueForCharacteristicListener,
  requestPermission,
  applyOmoiyari,
  retrieveServices,
  RetrieveServicesParams,
  createTryRetrieveServicesFn,
  bonding,
  BondingParams,
  createTryBondFn,
  connect,
  createTryConnectFn,
  ConnectParams,
  readValue,
  createTryReadValueFn,
  ReadValueParams,
  writeValue,
  createTryWriteValueFn,
  WriteValueParams,
  registerDisconnectPeripheralListener,
  createHandleDisconnectPeripheral,
} from './libs';
import {BlueveryState as _BlueveryState} from './blueveryState';
import autoBind from 'auto-bind';
import {DEFAULT_OMOIYARI_TIME} from './utils/constants';

type ConstructorArgs = {
  BlueveryState: typeof _BlueveryState;
};

const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

export class BlueveryCore {
  static originalBleManager = BleManager;

  #userDefinedOptions: BlueveryOptions = {};
  #state: _BlueveryState;
  stateEmitter: Eventmitter<State>;

  constructor({BlueveryState}: ConstructorArgs) {
    this.#state = new BlueveryState({});
    this.stateEmitter = this.#state.stateEmitter;
    autoBind(this);
  }

  async init(blueveryOptions?: BlueveryOptions) {
    if (blueveryOptions) {
      this.setUserDefinedOptions(blueveryOptions);
    }

    /**
     * disconnect処理の登録
     */
    const handleDisconnectPeripheral = createHandleDisconnectPeripheral({
      onDisconnectPeripheral: (disconnectInfo) => {
        this.#state.deletePeripheralFromManagingPeripherals(
          disconnectInfo.peripheral,
        );
      },
      optionalOnDisconnectPeripheral:
        blueveryOptions?.onDisconnectPeripheralHandler,
    });
    this.#disconnectPeripheralListener = registerDisconnectPeripheralListener(
      bleManagerEmitter,
      handleDisconnectPeripheral,
    );

    /**
     * init段階ですでにconnectedなperipheralを保存する
     */
    await BleManager.getConnectedPeripherals([]).then((peripherals) => {
      peripherals.forEach((peripheral) => {
        this.#state.setPeripheralToManagingPeripherals(peripheral),
          this.#state.setManagingPeripheralConnected(peripheral.id);
      });
    });
    if (Platform.OS === 'android') {
      await BleManager.getBondedPeripherals().then((peripherals) => {
        peripherals.forEach((peripheral) => {
          this.#state.setPeripheralToManagingPeripherals(peripheral);
          this.#state.setPeripheralIsBonded(peripheral.id);
        });
      });
    }
  }

  /**
   * @property listeners
   */
  #discoverPeripheralListener?: EmitterSubscription;
  #notificationValueForCharacteristicListener?: EmitterSubscription;
  #disconnectPeripheralListener?: EmitterSubscription;

  setUserDefinedOptions(options: BlueveryOptions) {
    this.#userDefinedOptions = options;
  }

  emitState(): void {
    this.#state.emitState();
  }

  getState(): Readonly<State> {
    return this.#state.getState();
  }

  clearScannedPeripherals(): void {
    this.#state.clearScannedPeripherals();
  }

  private async requireCheckBeforeBleProcess() {
    /**
     * initialize managing
     */
    await this.managing();

    const [, , requestedButUngranted] = await this.checkAndRequestPermission();
    if (requestedButUngranted?.length) {
      return false;
    }

    const isEnableBluetooth = await this.checkBluetoothEnabled();
    if (!isEnableBluetooth) {
      return false;
    }

    /**
     * check passed.
     */
    return true;
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

      if (requestedButUngranted.length) {
        this.#state.setPermissionUnGranted(requestedButUngranted);
      } else {
        this.#state.setPermissionGranted();
      }
      return [granted, requestedThenGranted, requestedButUngranted];
    }
    this.#state.setPermissionGranted();
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
  }): Promise<void | false> {
    if (!this.getState().scanning) {
      const peripheralInfoHandler = createPeripheralInfoHandler({
        setPeripheralToScannedPeripherals: this.#state
          .setPeripheralToScannedPeripherals,
        handlePeripheralInfo: discoverHandler,
      });
      const handleDiscoverPeripheral = createHandleDiscoverPeripheral(
        onDiscoverPeripheral,
        {
          matchFn,
          peripheralInfoHandler,
        },
      );

      const isPassedRequireCheck = await this.requireCheckBeforeBleProcess();
      if (isPassedRequireCheck === false) {
        return false;
      }

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

  async connect({
    connectParams,
    retrieveServicesParams,
    bondingParams,
  }: {
    connectParams: ConnectParams;
    retrieveServicesParams: RetrieveServicesParams;
    bondingParams: BondingParams;
  }) {
    const [targetPeripheralId] = connectParams.connectParams;
    const isPassedRequireCheck = await this.requireCheckBeforeBleProcess();
    if (isPassedRequireCheck === false) {
      return false;
    }
    this.#state.setManagingPeripheralConnecting(targetPeripheralId);
    await connect(createTryConnectFn(BleManager.connect), connectParams);
    await retrieveServices(
      createTryRetrieveServicesFn(BleManager.retrieveServices),
      retrieveServicesParams,
    );
    await bonding(createTryBondFn(BleManager.createBond), bondingParams);
    this.#state.setPeripheralToManagingPeripherals(
      this.getState().scannedPeripherals[targetPeripheralId],
    );
    this.#state.setManagingPeripheralConnected(targetPeripheralId);
  }

  async checkCommunicateWithPeripheral({
    readValueParams,
    writeValueParams,
  }: {
    readValueParams: ReadValueParams;
    writeValueParams: WriteValueParams;
  }) {
    const [peripheralId] = readValueParams.readValueParams;
    this.#state.onCheckingCommunicateWithPeripheral(peripheralId);
    await writeValue(createTryWriteValueFn(BleManager.write), writeValueParams);
    await readValue(createTryReadValueFn(BleManager.read), readValueParams);
    this.#state.offCheckingCommunicateWithPeripheral(peripheralId);
  }

  /**
   * @description must call `this#connect` method before this method calling
   */
  async startNotification({
    startNotificationParams,
  }: {
    startNotificationParams: StartNotificationParams;
  }) {
    const [peripheralId] = startNotificationParams;
    /**
     * startNotificationが複数回呼ばれた場合listenerを一度破棄しておく
     */
    if (this.#notificationValueForCharacteristicListener) {
      this.#notificationValueForCharacteristicListener.remove();
      this.#state.offReceivingForCharacteristicValue(peripheralId);
    }

    const notificationListener = registerDidUpdateValueForCharacteristicListener(
      bleManagerEmitter,
      ({value}) => {
        // TODO: リスナーのハンドラ実装する
      },
    );
    this.#notificationValueForCharacteristicListener = notificationListener;
    await BleManager.startNotification(...startNotificationParams);
    this.#state.onReceivingForCharacteristicValue(peripheralId);
  }

  stopNotification({
    stopNotificationParams,
  }: {
    stopNotificationParams: StopNotificationParams;
  }) {
    const [peripheralId] = stopNotificationParams;
    return Promise.all([
      BleManager.stopNotification(...stopNotificationParams),
      this.#notificationValueForCharacteristicListener?.remove(),
      this.#state.offReceivingForCharacteristicValue(peripheralId),
    ]);
  }
}
