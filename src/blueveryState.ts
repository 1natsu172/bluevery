import {State, PeripheralInfo, PeripheralId} from './interface';
import {IMutationTree, ITrackStateTree, ProxyStateTree} from 'proxy-state-tree';
import {eventmit, Eventmitter} from 'eventmit';
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
  #_savedInitialState: State;
  #stateTree: ProxyStateTree<State>;
  #mutationState: IMutationTree<State>;
  #trackState: ITrackStateTree<State>;

  stateEmitter: Eventmitter<State>;

  constructor({
    initialState,
    onChangeStateHandler,
  }: {
    initialState?: State;
    onChangeStateHandler?: (...args: unknown[]) => unknown;
  }) {
    this.stateEmitter = eventmit<State>();
    this.#stateTree = new ProxyStateTree(createInitialState(initialState));
    this.#trackState = this.#stateTree.getTrackStateTree();
    this.#mutationState = this.#stateTree.getMutationTree();
    this.#mutationState.onMutation(() => {
      this.emitState();
      onChangeStateHandler && onChangeStateHandler();
    });
    this.#_savedInitialState = createInitialState(initialState);
    autoBind(this);
  }

  /**
   * ↓ primitive
   */
  emitState() {
    this.stateEmitter.emit(this.getState());
  }

  getState() {
    return this.#trackState.state;
  }

  /**
   * @description safe setter of the undefined key-value
   */
  setPeripheralInfoToManagingPeripherals(
    peripheralId: PeripheralId,
    peripheralInfo: Partial<PeripheralInfo>,
  ) {
    const existedPeripheral = this.#trackState.state.managingPeripherals[
      peripheralId
    ];
    const processedPeripheral: PeripheralInfo = {
      ...existedPeripheral,
      ...peripheralInfo,
    };
    this.#mutationState.state.managingPeripherals[
      peripheralId
    ] = processedPeripheral;
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
    this.#mutationState.state = this.#_savedInitialState;
  }

  /**
   * re-initialize state by new initial state
   */
  reInitState(newInitialState: State) {
    this.#_savedInitialState = newInitialState;
    this.#mutationState.state = newInitialState;
  }

  /**
   * ↓ state change handlers
   */
  onManaging() {
    this.#mutationState.state.managing = true;
  }
  offManaging() {
    this.#mutationState.state.managing = false;
  }

  setBluetoothEnabled() {
    this.#mutationState.state.bluetoothEnabled = true;
  }
  setBluetoothDisabled() {
    this.#mutationState.state.bluetoothEnabled = false;
  }

  onScanning() {
    this.#mutationState.state.scanning = true;
  }
  offScanning() {
    this.#mutationState.state.scanning = false;
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

  onCheckingCommunicateWithPeripheral(peripheralId: PeripheralId) {
    this.setManagingPeripheralInfoProperty(
      peripheralId,
      'checkingCommunicate',
      true,
    );
  }
  offCheckingCommunicateWithPeripheral(peripheralId: PeripheralId) {
    this.setManagingPeripheralInfoProperty(
      peripheralId,
      'checkingCommunicate',
      false,
    );
  }

  setPermissionGranted() {
    this.#mutationState.state.permissionGranted = {
      is: 'granted',
      lack: [],
    };
  }
  setPermissionUnGranted(lack: Permission[]) {
    this.#mutationState.state.permissionGranted = {
      is: 'ungranted',
      lack,
    };
  }

  setPeripheralToScannedPeripherals(peripheral: Peripheral) {
    this.#mutationState.state.scannedPeripherals[peripheral.id] = peripheral;
  }
  clearScannedPeripherals() {
    this.#mutationState.state.scannedPeripherals = this.#_savedInitialState.scannedPeripherals;
  }

  setPeripheralToManagingPeripherals(peripheralInfo: PeripheralInfo) {
    this.setPeripheralInfoToManagingPeripherals(
      peripheralInfo.id,
      peripheralInfo,
    );
  }
  deletePeripheralFromManagingPeripherals(peripheralId: PeripheralId) {
    delete this.#mutationState.state.managingPeripherals[peripheralId];
  }

  setPeripheralIsBonded(peripheralId: PeripheralId) {
    this.setManagingPeripheralInfoProperty(peripheralId, 'bonded', true);
  }
}
