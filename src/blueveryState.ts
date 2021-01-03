import {State, PeripheralInfo, PeripheralId} from './interface';
import {IMutationTree, ITrackStateTree, ProxyStateTree} from 'proxy-state-tree';
import {eventmit, Eventmitter} from 'eventmit';
import autoBind from 'auto-bind';
import {Permission} from 'react-native-permissions';

function createInitialState(overrideState?: Partial<State>): State {
  return {
    bluetoothEnabled: false,
    permissionGranted: {
      is: 'unknown',
      lack: [],
    },
    managing: false,
    connecting: false,
    checkingCommunicateWithPeripheral: false,
    scanning: false,
    receivingForCharacteristicValue: false,
    error: undefined,
    peripherals: {},
    connectedPeripherals: {},
    characteristicValues: [],
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
   * state change handlers
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

  onConnecting() {
    this.#mutationState.state.connecting = true;
  }
  offConnecting() {
    this.#mutationState.state.connecting = false;
  }

  onReceivingForCharacteristicValue() {
    this.#mutationState.state.receivingForCharacteristicValue = true;
  }
  offReceivingForCharacteristicValue() {
    this.#mutationState.state.receivingForCharacteristicValue = false;
  }

  onCheckingCommunicateWithPeripheral() {
    this.#mutationState.state.checkingCommunicateWithPeripheral = true;
  }
  offCheckingCommunicateWithPeripheral() {
    this.#mutationState.state.checkingCommunicateWithPeripheral = false;
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

  setPeripheralToState(peripheralInfo: PeripheralInfo) {
    this.#mutationState.state.peripherals[peripheralInfo.id] = peripheralInfo;
  }
  clearPeripherals() {
    this.#mutationState.state.peripherals = this.#_savedInitialState.peripherals;
  }

  setPeripheralToConnectedPeripherals(peripheralInfo: PeripheralInfo) {
    this.#mutationState.state.connectedPeripherals[
      peripheralInfo.id
    ] = peripheralInfo;
  }
  deletePeripheralFromConnectedPeripherals(peripheralId: PeripheralId) {
    delete this.#mutationState.state.connectedPeripherals[peripheralId];
  }

  setPeripheralIsBonded(peripheralInfo: PeripheralInfo) {
    const existedPeripheral = this.#trackState.state.connectedPeripherals[
      peripheralInfo.id
    ];
    const processedPeripheral: PeripheralInfo = {
      ...peripheralInfo,
      ...existedPeripheral,
      bonded: true,
    };
    this.#mutationState.state.connectedPeripherals[
      peripheralInfo.id
    ] = processedPeripheral;
  }

  setCharacteristicValues(value: unknown) {
    this.#mutationState.state.characteristicValues.push(value);
  }
}
