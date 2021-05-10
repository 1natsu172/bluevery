import {NativeModules, NativeEventEmitter, Platform} from 'react-native';
import BleManager, {Peripheral} from 'react-native-ble-manager';
import {Permission} from 'react-native-permissions';
import delay from 'delay';
import {
  BlueveryOptions,
  BlueveryMethodOptions,
  PeripheralInfo,
  Store,
  State,
  BleManagerParams,
  PeripheralId,
  PublicHandlers,
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
  toBetterPromise,
  toThrowErrorIfRejected,
  toInspectPromiseReturnValue,
} from './utils';
import {BlueveryState as _BlueveryState} from './blueveryState';
import {BlueveryListeners as _BlueveryListeners} from './blueveryListeners';
import autoBind from 'auto-bind';
import {DEFAULT_OMOIYARI_TIME} from './constants';

type ConstructorArgs = {
  BlueveryState: typeof _BlueveryState;
  blueveryListeners: InstanceType<typeof _BlueveryListeners>;
  initialState?: State;
  onChangeStateHandler?: (state: State) => unknown;
  store: Store;
};

const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

export class BlueveryCore {
  static originalBleManager = BleManager;

  private userDefinedOptions: BlueveryOptions = {};
  private state: _BlueveryState;
  listeners: _BlueveryListeners;

  constructor({
    BlueveryState,
    blueveryListeners,
    initialState,
    onChangeStateHandler,
    store,
  }: ConstructorArgs) {
    this.state = new BlueveryState({
      store,
      initialState,
      onChangeStateHandler,
    });
    this.listeners = blueveryListeners;
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
        const peripheralId = disconnectInfo.peripheral;
        this.state.setManagingPeripheralDisconnected(peripheralId);
        this.listeners.removePeripheralPublicSubscription(peripheralId);
      },
      optionalOnDisconnectPeripheral:
        blueveryOptions?.onDisconnectPeripheralHandler,
    });
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

  stop() {
    this.listeners.removeAllSubscriptions();
    this.state.unsubscribeTheState();
  }

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
    connectOptions: BlueveryMethodOptions['connect'];
    retrieveServicesParams: BleManagerParams['retrieveServices'];
    retrieveServicesOptions: BlueveryMethodOptions['retrieveServices'];
    bondingParams: BleManagerParams['createBond'];
    bondingOptions: BlueveryMethodOptions['createBond'];
  }) {
    const [targetPeripheralId] = connectParams;
    const [, serviceUUIDs] = retrieveServicesParams;
    const isPassedRequireCheck = await this.requireCheckBeforeBleProcess();
    if (isPassedRequireCheck === false) {
      return false;
    }

    const isAlreadyConnected = await BleManager.isPeripheralConnected(
      targetPeripheralId,
      serviceUUIDs || [],
    );
    if (isAlreadyConnected) {
      return false;
    }

    // FIXME: selector化したい
    const peripheral = this.getState().scannedPeripherals[targetPeripheralId];
    if (!peripheral) {
      throw new Error(
        `${targetPeripheralId} is not found in scannedPeripherals`,
      );
    }
    this.state.setPeripheralToManagingPeripherals(peripheral);

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

    this.state.setManagingPeripheralConnected(targetPeripheralId);
  }

  /**
   * @description retrieveServices must have timeout
   */
  async retrieveServices(
    retrieveServicesParams: BleManagerParams['retrieveServices'],
    retrieveServicesOptions: BlueveryMethodOptions['retrieveServices'],
  ) {
    const [peripheralId] = retrieveServicesParams;

    const _retrieveServices = toBetterPromise(
      toThrowErrorIfRejected(BleManager.retrieveServices),
      retrieveServicesOptions,
    );

    this.state.setManagingPeripheralRetrieving(peripheralId);
    await _retrieveServices(...retrieveServicesParams)
      .then((_peripheralInfo) => {
        this.state.setManagingPeripheralRetrieved(peripheralId);
      })
      .catch((error) => {
        this.state.setManagingPeripheralRetrieveFailed(peripheralId);
        throw error;
      });
  }

  async writeValue({
    writeValueParams,
    writeValueOptions,
    retrieveServicesParams,
    retrieveServicesOptions,
  }: {
    writeValueParams: BleManagerParams['write'];
    writeValueOptions: BlueveryMethodOptions['write'];
    retrieveServicesParams: BleManagerParams['retrieveServices'];
    retrieveServicesOptions: BlueveryMethodOptions['retrieveServices'];
  }) {
    const [peripheralId] = writeValueParams;

    const isPassedRequireCheck = await this.requireCheckBeforeBleProcess();
    if (isPassedRequireCheck === false) {
      return false;
    }

    // FIXME: selector化
    this.checkThePeripheralIsManaging(peripheralId);
    const targetPeripheralId = this.getState().managingPeripherals[
      peripheralId
    ];

    /**
     * @description must call `this#retrieveServices` method before write calling
     */
    // FIXME: selector化で吸収したら型もundefinedになりようがないので ! 消せる
    if (targetPeripheralId!.retrieveServices !== 'retrieved') {
      await this.retrieveServices(
        retrieveServicesParams,
        retrieveServicesOptions,
      );
    }

    const _writeValue = toBetterPromise(
      toThrowErrorIfRejected(BleManager.write),
      writeValueOptions,
    );

    try {
      this.state.setPeripheralCommunicateIsWriting(peripheralId);
      return await _writeValue(...writeValueParams);
    } catch (error) {
      throw error;
    } finally {
      this.state.setPeripheralCommunicateIsNon(peripheralId);
    }
  }

  async readValue({
    readValueParams,
    readValueOptions,
    retrieveServicesParams,
    retrieveServicesOptions,
  }: {
    readValueParams: BleManagerParams['read'];
    readValueOptions: BlueveryMethodOptions['read'];
    retrieveServicesParams: BleManagerParams['retrieveServices'];
    retrieveServicesOptions: BlueveryMethodOptions['retrieveServices'];
  }) {
    const [peripheralId] = readValueParams;

    const isPassedRequireCheck = await this.requireCheckBeforeBleProcess();
    if (isPassedRequireCheck === false) {
      return false;
    }

    // FIXME: selector化
    this.checkThePeripheralIsManaging(peripheralId);
    const targetPeripheralId = this.getState().managingPeripherals[
      peripheralId
    ];

    /**
     * @description must call `this#retrieveServices` method before read calling
     */
    // FIXME: selector化で吸収したら型もundefinedになりようがないので ! 消せる
    if (targetPeripheralId!.retrieveServices !== 'retrieved') {
      await this.retrieveServices(
        retrieveServicesParams,
        retrieveServicesOptions,
      );
    }

    const _readValue = toBetterPromise(
      toThrowErrorIfRejected(
        toInspectPromiseReturnValue(
          BleManager.read,
          readValueOptions.advanceRetryCondition,
        ),
      ),
      readValueOptions,
    );

    try {
      this.state.setPeripheralCommunicateIsReading(peripheralId);
      return await _readValue(...readValueParams);
    } catch (error) {
      throw error;
    } finally {
      this.state.setPeripheralCommunicateIsNon(peripheralId);
    }
  }

  async startNotification({
    startNotificationParams,
    receiveCharacteristicHandler,
    retrieveServicesParams,
    retrieveServicesOptions,
  }: {
    startNotificationParams: BleManagerParams['startNotification'];
    receiveCharacteristicHandler: PublicHandlers['HandleDidUpdateValueForCharacteristic'];
    retrieveServicesParams: BleManagerParams['retrieveServices'];
    retrieveServicesOptions: BlueveryMethodOptions['retrieveServices'];
  }) {
    const [peripheralId] = startNotificationParams;

    // FIXME: selector化
    this.checkThePeripheralIsManaging(peripheralId);
    const targetPeripheralId = this.getState().managingPeripherals[
      peripheralId
    ];

    /**
     * @description must call `this#retrieveServices` method before startNotification calling
     */
    // FIXME: selector化で吸収したら型もundefinedになりようがないので ! 消せる
    if (targetPeripheralId!.retrieveServices !== 'retrieved') {
      await this.retrieveServices(
        retrieveServicesParams,
        retrieveServicesOptions,
      );
    }

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
      receiveCharacteristicHandler,
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
