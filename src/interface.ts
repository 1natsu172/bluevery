import {Eventmitter} from 'eventmit';
import {EmitterSubscription} from 'react-native';
import BleManager, {Peripheral} from 'react-native-ble-manager';
import {Permission} from 'react-native-permissions';
import {DisconnectedPeripheralHandler} from './libs';

export type BlueveryOptions = {
  onDisconnectPeripheralHandler?: DisconnectedPeripheralHandler;
};

export type PeripheralId = string;
export type PeripheralInfo = Peripheral & {
  connect?: 'connecting' | 'connected' | 'disconnected' | 'failed';
  bonded?: boolean;
  communicate?: 'reading' | 'writing';
  checkingCommunicate?: boolean;
  receivingForCharacteristicValue?: boolean;
};

export type State = {
  bluetoothEnabled: boolean;
  permissionGranted: {
    is: 'granted' | 'ungranted' | 'unknown';
    lack: Permission[];
  };
  managing: boolean;
  scanning: boolean;
  scannedPeripherals: {[key in PeripheralId]: Peripheral};
  managingPeripherals: {[key in PeripheralId]: PeripheralInfo};
  error: Error | undefined;
};

export type Listeners = {stateListener: Eventmitter<State>};
export type PublicListeners = {
  [key in PeripheralId]: {
    receivingForCharacteristicValueListener?: EmitterSubscription;
  };
};

export type BlueveryEvents = 'didChangeBlueveryState';

/**
 * options
 */
export type ScanningSettings = Parameters<typeof BleManager.scan>;
export type StartNotificationParams = Parameters<
  typeof BleManager.startNotification
>;
export type StopNotificationParams = Parameters<
  typeof BleManager.stopNotification
>;
