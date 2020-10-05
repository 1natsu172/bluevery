import {State, PeripheralInfo} from './interface';
import {IMutationTree, ITrackStateTree, ProxyStateTree} from 'proxy-state-tree';

const initialState: State = {
  bluetoothEnabled: false,
  permissionGranted: false,
  managing: false,
  connecting: false,
  scanning: false,
  error: undefined,
  peripherals: new Map(),
  // notificationListeners: any[],
};

export class BlueveryState {
  #stateTree: ProxyStateTree<State>;
  #mutationState: IMutationTree<State>;
  #trackState: ITrackStateTree<State>;

  constructor({
    onChangeStateHandler,
  }: {
    onChangeStateHandler: (...args: unknown[]) => unknown;
  }) {
    this.#stateTree = new ProxyStateTree(initialState);
    this.#trackState = this.#stateTree.getTrackStateTree();
    this.#mutationState = this.#stateTree.getMutationTree();
    this.#mutationState.onMutation(() => {
      onChangeStateHandler();
    });
  }

  /**
   * premitive
   */
  getState = () => {
    return this.#trackState.state;
  };

  onManaging = () => {
    this.#mutationState.state.managing = true;
  };
  offManaging = () => {
    this.#mutationState.state.managing = false;
  };

  setBluetoothEnabled = () => {
    this.#mutationState.state.bluetoothEnabled = true;
  };
  setBluetoothDisabled = () => {
    this.#mutationState.state.bluetoothEnabled = false;
  };

  onScanning = () => {
    this.#mutationState.state.scanning = true;
  };
  offScanning = () => {
    this.#mutationState.state.scanning = false;
  };

  setPeripheralToState = (peripheralInfo: PeripheralInfo) => {
    Reflect.set(
      this.#mutationState.state.peripherals,
      peripheralInfo.id,
      peripheralInfo,
    );
  };
}
