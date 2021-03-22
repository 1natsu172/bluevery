import {NativeModules, NativeEventEmitter, Platform} from 'react-native';
import BleManager, {Peripheral} from 'react-native-ble-manager';
import {Permission} from 'react-native-permissions';
import delay from 'delay';
import {
  BlueveryOptions,
  PeripheralInfo,
  State,
  BleManagerParams,
  PeripheralId,
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
  registerDisconnectPeripheralListener,
  createHandleDisconnectPeripheral,
} from './libs';
import {
  ToBetterOptions,
  toBetterPromise,
  toThrowErrorIfRejected,
} from './utils';
import {BlueveryState as _BlueveryState} from './blueveryState';
import {BlueveryListeners as _BlueveryListeners} from './blueveryListeners';
import autoBind from 'auto-bind';
import {DEFAULT_OMOIYARI_TIME} from './constants';

type ConstructorArgs = {
  BlueveryState: typeof _BlueveryState;
  BlueveryListeners: typeof _BlueveryListeners;
  initialState?: State;
  onChangeStateHandler?: (state: State) => unknown;
};

const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

export class BlueveryCore {
  static originalBleManager = BleManager;

  private userDefinedOptions: BlueveryOptions = {};
  private state: _BlueveryState;
  private listeners: _BlueveryListeners;
  private __DO_NOT_DIRECT_USE_STATE__: State;

  constructor({
    BlueveryState,
    BlueveryListeners,
    initialState,
    onChangeStateHandler,
  }: ConstructorArgs) {
    this.state = new BlueveryState({initialState, onChangeStateHandler});
    this.__DO_NOT_DIRECT_USE_STATE__ = this.state.mutationState;
    this.listeners = new BlueveryListeners();
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
        this.state.deletePeripheralFromManagingPeripherals(
          disconnectInfo.peripheral,
        );
      },
      optionalOnDisconnectPeripheral:
        blueveryOptions?.onDisconnectPeripheralHandler,
    });
    // TODO: removeの処理実装する
    this.listeners.setAnyInternalSubscription(
      'disconnectPeripheralListener',
      registerDisconnectPeripheralListener(
        bleManagerEmitter,
        handleDisconnectPeripheral,
      ),
    );

    /**
     * init段階ですでにconnectedなperipheralを保存する
     */
    await BleManager.getConnectedPeripherals([]).then((peripherals) => {
      peripherals.forEach((peripheral) => {
        this.state.setPeripheralToManagingPeripherals(peripheral);
        this.state.setManagingPeripheralConnected(peripheral.id);
      });
    });
    if (Platform.OS === 'android') {
      await BleManager.getBondedPeripherals().then((peripherals) => {
        peripherals.forEach((peripheral) => {
          this.state.setPeripheralToManagingPeripherals(peripheral);
          this.state.setPeripheralIsBonded(peripheral.id);
        });
      });
    }
  }

  /**
   * @property listeners
   */
  // private discoverPeripheralListener?: EmitterSubscription;
  // private disconnectPeripheralListener?: EmitterSubscription;

  setUserDefinedOptions(options: BlueveryOptions) {
    this.userDefinedOptions = options;
  }

  getState(): Readonly<State> {
    return this.state.getState();
  }

  clearScannedPeripherals(): void {
    this.state.clearScannedPeripherals();
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

  private checkThePeripheralIsManaging(peripheralId: PeripheralId) {
    if (!this.getState().managingPeripherals[peripheralId]) {
      throw new Error(`${peripheralId} is not found in managingPeripherals`);
    }
  }

  private async checkBluetoothEnabled() {
    const isEnabled = await checkBluetoothEnabled();
    if (isEnabled) {
      this.state.setBluetoothEnabled();
    } else {
      this.state.setBluetoothDisabled();
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
        this.state.setPermissionUnGranted(requestedButUngranted);
      } else {
        this.state.setPermissionGranted();
      }
      return [granted, requestedThenGranted, requestedButUngranted];
    }
    this.state.setPermissionGranted();
    return [granted];
  }

  private async managing() {
    if (this.getState().managing === false) {
      await BleManager.start().then(() => {
        this.state.onManaging();
      });
    }
  }

  async scan({
    scanningSettings,
    discoverHandler,
    matchFn,
  }: {
    scanningSettings: BleManagerParams['scan'];
    discoverHandler?: (peripheralInfo: PeripheralInfo) => any;
    matchFn?: (peripheral: Peripheral) => boolean;
  }): Promise<void | false> {
    if (!this.getState().scanning) {
      const peripheralInfoHandler = createPeripheralInfoHandler({
        setPeripheralToScannedPeripherals: this.state
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

      this.state.onScanning();

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
      this.listeners.setAnyInternalSubscription(
        'discoverPeripheralListener',
        discoverPeripheralListener,
      );

      // note: スキャン秒数の担保。指定秒数経ったらscan処理を終える
      const [, scanSeconds] = scanningSettings;
      await delay(scanSeconds * 1000).then(this.cleanupScan);
    }
  }

  private cleanupScan() {
    return Promise.all([
      BleManager.stopScan(),
      this.listeners.internalListeners.discoverPeripheralListener?.remove(),
      this.state.offScanning(),
    ]);
  }

  async connect({
    connectParams,
    connectOptions,
    retrieveServicesParams,
    retrieveServicesOptions,
    bondingParams,
    bondingOptions,
  }: {
    connectParams: BleManagerParams['connect'];
    connectOptions: ToBetterOptions;
    retrieveServicesParams: BleManagerParams['retrieveServices'];
    retrieveServicesOptions: ToBetterOptions;
    bondingParams: BleManagerParams['createBond'];
    bondingOptions: ToBetterOptions;
  }) {
    const [targetPeripheralId] = connectParams;
    const isPassedRequireCheck = await this.requireCheckBeforeBleProcess();
    if (isPassedRequireCheck === false) {
      return false;
    }
    this.state.setManagingPeripheralConnecting(targetPeripheralId);

    const _connect = toBetterPromise(
      toThrowErrorIfRejected(BleManager.connect),
      connectOptions,
    );

    const _retrieveServices = toBetterPromise(
      toThrowErrorIfRejected(BleManager.retrieveServices),
      retrieveServicesOptions,
    );

    const _bonding = toBetterPromise(
      toThrowErrorIfRejected(BleManager.createBond),
      bondingOptions,
    );

    await _connect(...connectParams);
    await _retrieveServices(...retrieveServicesParams);
    await _bonding(...bondingParams);

    this.state.setPeripheralToManagingPeripherals(
      this.getState().scannedPeripherals[targetPeripheralId],
    );
    this.state.setManagingPeripheralConnected(targetPeripheralId);
  }

  async writeValue(
    writeValueParams: BleManagerParams['write'],
    options: ToBetterOptions,
  ) {
    const [peripheralId] = writeValueParams;

    const isPassedRequireCheck = await this.requireCheckBeforeBleProcess();
    if (isPassedRequireCheck === false) {
      return false;
    }

    this.checkThePeripheralIsManaging(peripheralId);

    const _writeValue = toBetterPromise(
      toThrowErrorIfRejected(BleManager.write),
      options,
    );

    let returnValue;
    try {
      this.state.setPeripheralCommunicateIsWriting(peripheralId);
      returnValue = await _writeValue(...writeValueParams);
    } catch (error) {
      throw error;
    } finally {
      this.state.setPeripheralCommunicateIsNon(peripheralId);
      return returnValue;
    }
  }

  async readValue(
    readValueParams: BleManagerParams['read'],
    options: ToBetterOptions,
  ) {
    const [peripheralId] = readValueParams;

    const isPassedRequireCheck = await this.requireCheckBeforeBleProcess();
    if (isPassedRequireCheck === false) {
      return false;
    }

    this.checkThePeripheralIsManaging(peripheralId);

    const _readValue = toBetterPromise(
      toThrowErrorIfRejected(BleManager.read),
      options,
    );

    let returnValue;
    try {
      this.state.setPeripheralCommunicateIsReading(peripheralId);
      returnValue = await _readValue(...readValueParams);
    } catch (error) {
      throw error;
    } finally {
      this.state.setPeripheralCommunicateIsNon(peripheralId);
      return returnValue;
    }
  }

  /**
   * @description must call `this#connect` method before this method calling
   */
  async startNotification({
    startNotificationParams,
  }: {
    startNotificationParams: BleManagerParams['startNotification'];
  }) {
    const [peripheralId] = startNotificationParams;
    /**
     * startNotificationが複数回呼ばれた場合listenerを一度破棄しておく
     */
    if (this.listeners.publicListeners[peripheralId]) {
      this.listeners.publicListeners[
        peripheralId
      ]?.receivingForCharacteristicValueListener?.remove();
      this.state.offReceivingForCharacteristicValue(peripheralId);
    }

    const notificationListener = registerDidUpdateValueForCharacteristicListener(
      bleManagerEmitter,
      ({value}) => {
        // TODO: リスナーのハンドラ実装する
      },
    );
    this.listeners.setAnyPublicSubscription(
      peripheralId,
      'receivingForCharacteristicValueListener',
      notificationListener,
    );
    await BleManager.startNotification(...startNotificationParams);
    this.state.onReceivingForCharacteristicValue(peripheralId);
  }

  stopNotification({
    stopNotificationParams,
  }: {
    stopNotificationParams: BleManagerParams['stopNotification'];
  }) {
    const [peripheralId] = stopNotificationParams;
    return Promise.all([
      BleManager.stopNotification(...stopNotificationParams),
      this.listeners.publicListeners[
        peripheralId
      ]?.receivingForCharacteristicValueListener?.remove(),
      this.state.offReceivingForCharacteristicValue(peripheralId),
    ]);
  }
}
