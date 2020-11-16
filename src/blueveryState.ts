import {State, PeripheralInfo} from './interface';
import {IMutationTree, ITrackStateTree, ProxyStateTree} from 'proxy-state-tree';
import {eventmit, Eventmitter} from 'eventmit';
import autoBind from 'auto-bind';
import {Permission} from 'react-native-permissions';

export class BlueveryState {
  #_initialState: State = {
    bluetoothEnabled: false,
    permissionGranted: {
      is: 'unknown',
      lack: [],
    },
    managing: false,
    connecting: false,
    scanning: false,
    error: undefined,
    peripherals: new Map(),
    // notificationListeners: any[],
  };
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
    this.#stateTree = new ProxyStateTree(initialState || this.#_initialState);
    this.#trackState = this.#stateTree.getTrackStateTree();
    this.#mutationState = this.#stateTree.getMutationTree();
    this.#mutationState.onMutation(() => {
      this.emitState();
      onChangeStateHandler && onChangeStateHandler();
    });
    autoBind(this);
  }

  /**
   * premitive
   */
  emitState() {
    this.stateEmitter.emit(this.getState());
  }

  getState() {
    return this.#trackState.state;
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
    Reflect.set(
      this.#mutationState.state.peripherals,
      peripheralInfo.id,
      peripheralInfo,
    );
  }
}
