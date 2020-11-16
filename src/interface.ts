import {Eventmitter} from 'eventmit';
import BleManager, {Peripheral} from 'react-native-ble-manager';
import {Permission} from 'react-native-permissions';

export type BlueveryOptions = {};

export type PeripheralId = string;
export type PeripheralInfo = Peripheral & {
  connected?: boolean;
};

export type State = {
  bluetoothEnabled: boolean;
  permissionGranted: {
    is: 'granted' | 'ungranted' | 'unknown';
    lack: Permission[];
  };
  managing: boolean;
  scanning: boolean;
  connecting: boolean;
  peripherals: Map<PeripheralId, PeripheralInfo>;
  error: Error | undefined;
};

export type Listeners = {stateListener: Eventmitter<State>};

export type BlueveryEvents = 'didChangeBlueveryState';

/**
 * options
 */
export type ScanningSettings = Parameters<typeof BleManager.scan>;
