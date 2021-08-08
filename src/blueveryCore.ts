import {NativeModules, NativeEventEmitter, Platform} from 'react-native';
import BleManager, {Peripheral} from 'react-native-ble-manager';
import {Permission} from 'react-native-permissions';
import delay from 'delay';
import {
  BlueveryOptions,
  BlueveryCoreMethodOptions,
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
  debugBlueveryCore,
  toBetterPromise,
  toThrowErrorIfRejected,
  toInspectPromiseReturnValue,
  applyOmoiyari,
} from './utils';
import {BlueveryState as _BlueveryState} from './blueveryState';
import {BlueveryListeners as _BlueveryListeners} from './blueveryListeners';
import autoBind from 'auto-bind';

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

  private delayInstanceOfScan: ReturnType<typeof delay> | undefined;

  constructor({
    BlueveryState,
    blueveryListeners,
    initialState,
    onChangeStateHandler,
    store,
  }: ConstructorArgs) {
    debugBlueveryCore('construct start');
    this.state = new BlueveryState({
      store,
      initialState,
      onChangeStateHandler,
    });
    this.listeners = blueveryListeners;
    autoBind(this);
    debugBlueveryCore('construct end');
  }

  async init(blueveryOptions?: BlueveryOptions) {
    debugBlueveryCore('init: start');
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
    debugBlueveryCore('init: already connected Peripherals to managing');
    await BleManager.getConnectedPeripherals([]).then((peripherals) => {
      peripherals.forEach((peripheral) => {
        debugBlueveryCore('init: already connected Peripheral: ', peripheral);
        this.state.setPeripheralToManagingPeripherals(peripheral);
        this.state.setManagingPeripheralConnected(peripheral.id);
      });
    });
    if (Platform.OS === 'android') {
      debugBlueveryCore('init: get already bonded Peripherals');
      await BleManager.getBondedPeripherals().then((peripherals) => {
        peripherals.forEach((peripheral) => {
          debugBlueveryCore(
            'init: already bonded Peripheral to managing',
            peripheral,
          );
          this.state.setPeripheralToManagingPeripherals(peripheral);
          this.state.setPeripheralIsBonded(peripheral.id);
        });
      });
    }
    debugBlueveryCore('init: end');
  }

  async stop() {
    debugBlueveryCore('stop: start');
    await Promise.all([
      this.listeners.removeAllSubscriptions(),
      this.state.unsubscribeTheState(),
      this.cleanupScan(),
    ]);
    debugBlueveryCore('stop: end');
  }

  setUserDefinedOptions(options: BlueveryOptions) {
    debugBlueveryCore('setUserDefinedOptions: start');
    this.userDefinedOptions = options;
    debugBlueveryCore('setUserDefinedOptions: end');
  }

  getState(): Readonly<State> {
    debugBlueveryCore('getState');
    return this.state.getState();
  }

  clearScannedPeripherals(): void {
    debugBlueveryCore('clearScannedPeripherals: start');
    this.state.clearScannedPeripherals();
    debugBlueveryCore('clearScannedPeripherals: end');
  }

  private async requireCheckBeforeBleProcess() {
    /**
     * initialize managing
     */
    debugBlueveryCore('requireCheckBeforeBleProcess: managing process start');
    await this.managing();
    debugBlueveryCore(
      'requireCheckBeforeBleProcess: managing process finished',
    );

    debugBlueveryCore(
      'requireCheckBeforeBleProcess: checkAndRequestPermission',
    );
    const [, , requestedButUngranted] = await this.checkAndRequestPermission();
    debugBlueveryCore(
      'requireCheckBeforeBleProcess: checkAndRequestPermission result',
      requestedButUngranted,
    );
    if (requestedButUngranted?.length) {
      return false;
    }

    debugBlueveryCore('requireCheckBeforeBleProcess: checkBluetoothEnabled');
    const isEnableBluetooth = await this.checkBluetoothEnabled();
    debugBlueveryCore(
      'requireCheckBeforeBleProcess: checkBluetoothEnabled result',
      isEnableBluetooth,
    );
    if (!isEnableBluetooth) {
      return false;
    }

    /**
     * check passed.
     */
    return true;
  }

  private checkThePeripheralIsManaging(peripheralId: PeripheralId) {
    debugBlueveryCore('checkThePeripheralIsManaging: start');
    if (!this.getState().managingPeripherals[peripheralId]) {
      debugBlueveryCore('checkThePeripheralIsManaging: throw');
      throw new Error(`${peripheralId} is not found in managingPeripherals`);
    }
    debugBlueveryCore('checkThePeripheralIsManaging: end');
  }

  private async checkBluetoothEnabled() {
    debugBlueveryCore('checkBluetoothEnabled: start');
    const isEnabled = await checkBluetoothEnabled();
    debugBlueveryCore('checkBluetoothEnabled: result', isEnabled);
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
    debugBlueveryCore('checkAndRequestPermission: check permission start');
    const [granted, ungranted] = await checkPermission();
    debugBlueveryCore(
      'checkAndRequestPermission: checked permission result',
      granted,
      ungranted,
    );
    if (ungranted.length) {
      debugBlueveryCore('checkAndRequestPermission: request permission start');
      const [
        requestedThenGranted,
        requestedButUngranted,
      ] = await requestPermission(ungranted);

      if (requestedButUngranted.length) {
        this.state.setPermissionUnGranted(requestedButUngranted);
      } else {
        this.state.setPermissionGranted();
      }

      debugBlueveryCore(
        'checkAndRequestPermission: requested permission result',
        requestedThenGranted,
        requestedButUngranted,
      );
      return [granted, requestedThenGranted, requestedButUngranted];
    }
    this.state.setPermissionGranted();
    debugBlueveryCore('checkAndRequestPermission: pass permission', granted);
    return [granted];
  }

  private async managing() {
    debugBlueveryCore('managing: called');
    if (this.getState().managing === false) {
      debugBlueveryCore('managing: starting');
      await BleManager.start().then(() => {
        this.state.onManaging();
      });
    }
    debugBlueveryCore('managing: end');
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
    debugBlueveryCore('scan: called');
    if (!this.getState().scanning) {
      debugBlueveryCore('scan: prepare');
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
      debugBlueveryCore('scan: isPassedRequireCheck', isPassedRequireCheck);
      if (isPassedRequireCheck === false) {
        return false;
      }

      debugBlueveryCore('scan: start scanning');
      this.state.onScanning();

      const [, discoverPeripheralListener] = await Promise.all([
        // note: scan開始。promiseだがscan秒数待たないので後続処理でscan秒数を担保している
        await BleManager.scan(...scanningSettings).catch((error) => {
          debugBlueveryCore('scan: native scan but error caused', error);
          throw error;
        }),
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
      debugBlueveryCore('scan: awaiting for : ', scanSeconds);
      this.delayInstanceOfScan = delay(scanSeconds * 1000);
      await this.delayInstanceOfScan.then(this.cleanupScan);
      debugBlueveryCore('scan: end');
    }
  }

  cleanupScan() {
    debugBlueveryCore('cleanupScan: start');
    return Promise.all([
      this.delayInstanceOfScan?.clear(),
      BleManager.stopScan(),
      this.listeners.removeAnyInternalSubscription(
        'discoverPeripheralListener',
      ),
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
    connectOptions: BlueveryCoreMethodOptions['connect'];
    retrieveServicesParams: BleManagerParams['retrieveServices'];
    retrieveServicesOptions: BlueveryCoreMethodOptions['retrieveServices'];
    bondingParams: BleManagerParams['createBond'];
    bondingOptions: BlueveryCoreMethodOptions['createBond'];
  }) {
    debugBlueveryCore('connect: start', connectParams, retrieveServicesParams);
    const [targetPeripheralId] = connectParams;
    const [, serviceUUIDs] = retrieveServicesParams;
    const isPassedRequireCheck = await this.requireCheckBeforeBleProcess();
    debugBlueveryCore('connect: isPassedRequireCheck', isPassedRequireCheck);
    if (isPassedRequireCheck === false) {
      return false;
    }

    const isAlreadyConnected = await BleManager.isPeripheralConnected(
      targetPeripheralId,
      serviceUUIDs || [],
    );
    debugBlueveryCore('connect: isAlreadyConnected', isAlreadyConnected);
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

    const _connect = applyOmoiyari(
      toBetterPromise(
        toThrowErrorIfRejected(BleManager.connect),
        connectOptions,
      ),
      {time: connectOptions.omoiyariTime},
    );

    const _bonding = applyOmoiyari(
      toBetterPromise(
        toThrowErrorIfRejected(BleManager.createBond),
        bondingOptions,
      ),
      {time: bondingOptions.omoiyariTime},
    );

    try {
      debugBlueveryCore('connect: connect process start');
      this.state.setManagingPeripheralConnecting(targetPeripheralId);
      await _connect(...connectParams).then(() => {
        debugBlueveryCore('connect: connect success');
        this.state.setManagingPeripheralConnected(targetPeripheralId);
      });
      await this.retrieveServices(
        retrieveServicesParams,
        retrieveServicesOptions,
      );
      if (Platform.OS === 'android') {
        debugBlueveryCore('connect: bonding');
        await _bonding(...bondingParams);
        this.state.setPeripheralIsBonded(targetPeripheralId);
      }
    } catch (error) {
      debugBlueveryCore(
        'connect: An error has occurred in the connect process',
        error,
      );
      this.state.setManagingPeripheralFailedConnect(targetPeripheralId);
      throw error;
    }
    debugBlueveryCore('connect: connect process end');
  }

  async disconnect({
    disconnectParams,
    disconnectOptions,
  }: {
    disconnectParams: BleManagerParams['disconnect'];
    disconnectOptions: BlueveryCoreMethodOptions['disconnect'];
  }) {
    debugBlueveryCore('disconnect: start', disconnectParams);
    const [targetPeripheralId] = disconnectParams;

    const isAlreadyConnected = await BleManager.isPeripheralConnected(
      targetPeripheralId,
      [],
    );
    debugBlueveryCore('disconnect: isAlreadyConnected', isAlreadyConnected);
    if (!isAlreadyConnected) {
      return false;
    }

    // FIXME: selector化したい
    const peripheral = this.getState().scannedPeripherals[targetPeripheralId];
    if (!peripheral) {
      throw new Error(
        `${targetPeripheralId} is not found in scannedPeripherals`,
      );
    }

    const _disconnect = await toBetterPromise(
      toThrowErrorIfRejected(BleManager.disconnect),
      disconnectOptions,
    );

    try {
      debugBlueveryCore('disconnect: disconnect process start');
      await _disconnect(...disconnectParams).then(() => {
        debugBlueveryCore('disconnect: disconnect success');
        this.state.setManagingPeripheralDisconnected(targetPeripheralId);
      });
    } catch (error) {
      debugBlueveryCore(
        'disconnect: An error has occurred in the disconnect process',
        error,
      );
      throw error;
    }
    debugBlueveryCore('disconnect: disconnect process end');
  }

  /**
   * @description retrieveServices must have timeout
   */
  async retrieveServices(
    retrieveServicesParams: BleManagerParams['retrieveServices'],
    retrieveServicesOptions: BlueveryCoreMethodOptions['retrieveServices'],
  ) {
    debugBlueveryCore('retrieveServices: start', retrieveServicesParams);
    const [peripheralId] = retrieveServicesParams;

    const _retrieveServices = applyOmoiyari(
      toBetterPromise(
        toThrowErrorIfRejected(BleManager.retrieveServices),
        retrieveServicesOptions,
      ),
      {time: retrieveServicesOptions.omoiyariTime},
    );

    debugBlueveryCore('retrieveServices: retrieving');
    this.state.setManagingPeripheralRetrieving(peripheralId);
    await _retrieveServices(...retrieveServicesParams)
      .then((_peripheralInfo) => {
        debugBlueveryCore('retrieveServices: retrieved success');
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
    writeValueOptions: BlueveryCoreMethodOptions['write'];
    retrieveServicesParams: BleManagerParams['retrieveServices'];
    retrieveServicesOptions: BlueveryCoreMethodOptions['retrieveServices'];
  }) {
    debugBlueveryCore('writeValue: start', writeValueParams);
    const [peripheralId] = writeValueParams;

    const isPassedRequireCheck = await this.requireCheckBeforeBleProcess();
    debugBlueveryCore('writeValue: isPassedRequireCheck', isPassedRequireCheck);
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
      debugBlueveryCore('writeValue: start retrieve');
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
      debugBlueveryCore('writeValue: writing');
      this.state.setPeripheralCommunicateIsWriting(peripheralId);
      return await _writeValue(...writeValueParams);
    } catch (error) {
      debugBlueveryCore('writeValue: writing but error caused', error);
      throw error;
    } finally {
      this.state.setPeripheralCommunicateIsNon(peripheralId);
      debugBlueveryCore('writeValue: write end');
    }
  }

  async readValue({
    readValueParams,
    readValueOptions,
    retrieveServicesParams,
    retrieveServicesOptions,
  }: {
    readValueParams: BleManagerParams['read'];
    readValueOptions: BlueveryCoreMethodOptions['read'];
    retrieveServicesParams: BleManagerParams['retrieveServices'];
    retrieveServicesOptions: BlueveryCoreMethodOptions['retrieveServices'];
  }) {
    debugBlueveryCore('readValue: start', readValueParams);
    const [peripheralId] = readValueParams;

    const isPassedRequireCheck = await this.requireCheckBeforeBleProcess();
    debugBlueveryCore('readValue: isPassedRequireCheck', isPassedRequireCheck);
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
      debugBlueveryCore('readValue: start retrieve');
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
      debugBlueveryCore('readValue: reading');
      this.state.setPeripheralCommunicateIsReading(peripheralId);
      return await _readValue(...readValueParams);
    } catch (error) {
      debugBlueveryCore('readValue: reading but error caused', error);
      throw error;
    } finally {
      this.state.setPeripheralCommunicateIsNon(peripheralId);
      debugBlueveryCore('readValue: read end');
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
    retrieveServicesOptions: BlueveryCoreMethodOptions['retrieveServices'];
  }) {
    debugBlueveryCore('startNotification: called', startNotificationParams);
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
      debugBlueveryCore('startNotification: start retrieve');
      await this.retrieveServices(
        retrieveServicesParams,
        retrieveServicesOptions,
      );
    }

    /**
     * startNotificationが複数回呼ばれた場合listenerを一度破棄しておく
     */
    if (this.listeners.publicListeners[peripheralId]) {
      debugBlueveryCore(
        'startNotification: already exist a listener, remove it',
      );
      this.listeners.removeAnyPublicSubscription(
        peripheralId,
        'receivingForCharacteristicValueListener',
      );
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
    debugBlueveryCore('startNotification: start');
    await BleManager.startNotification(...startNotificationParams);
    this.state.onReceivingForCharacteristicValue(peripheralId);
    debugBlueveryCore('startNotification: end');
  }

  stopNotification({
    stopNotificationParams,
  }: {
    stopNotificationParams: BleManagerParams['stopNotification'];
  }) {
    debugBlueveryCore('stopNotification: start', stopNotificationParams);
    const [peripheralId] = stopNotificationParams;
    return Promise.all([
      BleManager.stopNotification(...stopNotificationParams),
      this.listeners.removeAnyPublicSubscription(
        peripheralId,
        'receivingForCharacteristicValueListener',
      ),
      this.state.offReceivingForCharacteristicValue(peripheralId),
    ]);
  }
}
