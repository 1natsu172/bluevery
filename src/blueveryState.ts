import {State, PeripheralInfo, PeripheralId} from './interface';
import {proxy, snapshot, subscribe} from 'valtio';
import autoBind from 'auto-bind';
import {Permission} from 'react-native-permissions';
import {Peripheral} from 'react-native-ble-manager';

function createInitialState(overrideState?: Partial<State>): State {
  return {
    bluetoothEnabled: false,
    permissionGranted: {
      is: 'unknown',
      lack: [],
    },
    managing: false,
    scanning: false,
    error: undefined,
    scannedPeripherals: {},
    managingPeripherals: {},
    ...overrideState,
  };
}

export class BlueveryState {
  private _savedInitialState: State;
  mutationState: State;
  private unsubscribeTheState: () => void;

  constructor({
    initialState,
    onChangeStateHandler,
  }: {
    initialState?: State;
    onChangeStateHandler?: (...args: unknown[]) => unknown;
  }) {
    this.mutationState = proxy(createInitialState(initialState));
    this.unsubscribeTheState = subscribe(
      this.mutationState,
      () => {
        onChangeStateHandler && onChangeStateHandler();
      },
      true, // reacted in sync
    );
    this._savedInitialState = createInitialState(initialState);
    autoBind(this);
  }

  /**
   * ↓ primitive
   */
  getState() {
    return snapshot(this.mutationState);
  }

  /**
   * @description safe setter of the undefined key-value
   */
  setPeripheralInfoToManagingPeripherals(
    peripheralId: PeripheralId,
    peripheralInfo: Partial<PeripheralInfo>,
  ) {
    const existedPeripheral = this.getState().managingPeripherals[peripheralId];
    const processedPeripheral: PeripheralInfo = {
      ...existedPeripheral,
      ...peripheralInfo,
    };
    this.mutationState.managingPeripherals[peripheralId] = processedPeripheral;
  }

  /**
   * @description setProperty util method
   */
  private setManagingPeripheralInfoProperty<Key extends keyof PeripheralInfo>(
    peripheralId: PeripheralId,
    key: Key,
    value: PeripheralInfo[Key],
  ) {
    this.setPeripheralInfoToManagingPeripherals(peripheralId, {[key]: value});
  }

  /**
   * reset to initial state
   */
  resetState() {
    this.mutationState = this._savedInitialState;
  }

  /**
   * re-initialize state by new initial state
   */
  reInitState(newInitialState: State) {
    this._savedInitialState = newInitialState;
    this.mutationState = newInitialState;
  }

  /**
   * ↓ state change handlers
   */
  onManaging() {
    this.mutationState.managing = true;
  }
  offManaging() {
    this.mutationState.managing = false;
  }

  setBluetoothEnabled() {
    this.mutationState.bluetoothEnabled = true;
  }
  setBluetoothDisabled() {
    this.mutationState.bluetoothEnabled = false;
  }

  onScanning() {
    this.mutationState.scanning = true;
  }
  offScanning() {
    this.mutationState.scanning = false;
  }

  setManagingPeripheralConnecting(peripheralId: PeripheralId) {
    this.setManagingPeripheralInfoProperty(
      peripheralId,
      'connect',
      'connecting',
    );
  }
  setManagingPeripheralConnected(peripheralId: PeripheralId) {
    this.setManagingPeripheralInfoProperty(
      peripheralId,
      'connect',
      'connected',
    );
  }
  setManagingPeripheralDisconnected(peripheralId: PeripheralId) {
    this.setManagingPeripheralInfoProperty(
      peripheralId,
      'connect',
      'disconnected',
    );
  }
  setManagingPeripheralFailedConnect(peripheralId: PeripheralId) {
    this.setManagingPeripheralInfoProperty(peripheralId, 'connect', 'failed');
  }

  onReceivingForCharacteristicValue(peripheralId: PeripheralId) {
    this.setManagingPeripheralInfoProperty(
      peripheralId,
      'receivingForCharacteristicValue',
      true,
    );
  }
  offReceivingForCharacteristicValue(peripheralId: PeripheralId) {
    this.setManagingPeripheralInfoProperty(
      peripheralId,
      'receivingForCharacteristicValue',
      false,
    );
  }

  setPermissionGranted() {
    this.mutationState.permissionGranted = {
      is: 'granted',
      lack: [],
    };
  }
  setPermissionUnGranted(lack: Permission[]) {
    this.mutationState.permissionGranted = {
      is: 'ungranted',
      lack,
    };
  }

  setPeripheralToScannedPeripherals(peripheral: Peripheral) {
    this.mutationState.scannedPeripherals[peripheral.id] = peripheral;
  }
  clearScannedPeripherals() {
    this.mutationState.scannedPeripherals = this._savedInitialState.scannedPeripherals;
  }

  setPeripheralToManagingPeripherals(peripheralInfo: PeripheralInfo) {
    this.setPeripheralInfoToManagingPeripherals(
      peripheralInfo.id,
      peripheralInfo,
    );
  }
  deletePeripheralFromManagingPeripherals(peripheralId: PeripheralId) {
    delete this.mutationState.managingPeripherals[peripheralId];
  }

  setPeripheralIsBonded(peripheralId: PeripheralId) {
    this.setManagingPeripheralInfoProperty(peripheralId, 'bonded', true);
  }

  setPeripheralCommunicateIsNon(peripheralId: PeripheralId) {
    this.setManagingPeripheralInfoProperty(
      peripheralId,
      'communicate',
      'nonCommunicate',
    );
  }
  setPeripheralCommunicateIsReading(peripheralId: PeripheralId) {
    this.setManagingPeripheralInfoProperty(
      peripheralId,
      'communicate',
      'reading',
    );
  }
  setPeripheralCommunicateIsWriting(peripheralId: PeripheralId) {
    this.setManagingPeripheralInfoProperty(
      peripheralId,
      'communicate',
      'writing',
    );
  }
}
