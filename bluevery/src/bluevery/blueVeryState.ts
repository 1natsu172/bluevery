import {State, PeripheralInfo} from './interface';
import onChange from 'on-change';

export class BlueveryState {
  #state: State = {
    bluetoothEnabled: false,
    permissionGranted: false,
    managing: false,
    connecting: false,
    scanning: false,
    error: undefined,
    peripherals: new Map(),
    // notificationListeners: any[],
  };

  constructor({
    onChangeStateHandler,
  }: {
    onChangeStateHandler: Parameters<typeof onChange>[1];
  }) {
    this.#state = onChange(this.#state, onChangeStateHandler);
  }

  onManaging = () => {
    this.#state.managing = true;
  };
  offManaging = () => {
    this.#state.managing = false;
  };

  setBluetoothEnabled = () => {
    this.#state.bluetoothEnabled = true;
  };
  setBluetoothDisabled = () => {
    this.#state.bluetoothEnabled = false;
  };

  onScanning = () => {
    this.#state.scanning = true;
  };
  offScanning = () => {
    this.#state.scanning = false;
  };

  setPeripheralToState = (peripheralInfo: PeripheralInfo) => {
    Reflect.set(this.#state.peripherals, peripheralInfo.id, peripheralInfo);
  };

  getState = () => {
    return this.#state;
  };
}
