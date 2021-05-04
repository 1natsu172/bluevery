import {EmitterSubscription} from 'react-native';
import BleManager, {Peripheral} from 'react-native-ble-manager';
import {Permission} from 'react-native-permissions';
import {
  DisconnectedPeripheralHandler,
  HandleDidUpdateValueForCharacteristic,
} from './libs';
import {MethodParamsRecord} from './utils/typeUtils/MethodParamsRecord';

export type BlueveryOptions = {
  onDisconnectPeripheralHandler?: DisconnectedPeripheralHandler;
  onChangeStateHandler?: (state: State) => unknown;
  initialState?: State;
};

export type PeripheralId = string;
export type PeripheralInfo = Peripheral & {
  connect?: 'connecting' | 'connected' | 'disconnected' | 'failed';
  bonded?: 'unknown' | boolean;
  communicate?: 'nonCommunicate' | 'reading' | 'writing';
  receivingForCharacteristicValue?: boolean;
  retrieveServices?: 'retrieving' | 'retrieved' | 'failed';
};

export type State = {
  bluetoothEnabled: boolean;
  permissionGranted: {
    is: 'granted' | 'ungranted' | 'unknown';
    lack: Permission[];
  };
  managing: boolean;
  scanning: boolean;
  scannedPeripherals: {[key in PeripheralId]?: Peripheral};
  managingPeripherals: {[key in PeripheralId]?: PeripheralInfo};
  error: Error | undefined;
};

export type PublicSubscriptions = {
  receivingForCharacteristicValueListener?: EmitterSubscription;
};
export type PublicListeners = {
  [key in PeripheralId]?: PublicSubscriptions;
};
export type InternalListeners = {
  discoverPeripheralListener?: EmitterSubscription;
  disconnectPeripheralListener?: EmitterSubscription;
};

export interface PublicHandlers {
  HandleDidUpdateValueForCharacteristic: HandleDidUpdateValueForCharacteristic;
}

export type BlueveryEvents = 'didChangeBlueveryState';

/**
 * BleManager interface
 */
export type TBleManager = typeof BleManager;
export type BleManagerParams = MethodParamsRecord<TBleManager>;
