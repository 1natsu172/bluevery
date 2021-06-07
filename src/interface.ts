import {EmitterSubscription} from 'react-native';
import BleManager, {Peripheral} from 'react-native-ble-manager';
import {Permission} from 'react-native-permissions';
import {
  DisconnectedPeripheralHandler,
  HandleDidUpdateValueForCharacteristic,
} from './libs';
import {
  InspectorFn,
  ToBetterOptions,
  ToBetterOptionsWithMustTimeout,
} from './utils';
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

export type Store = {
  bluevery: State;
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

/**
 * Bluevery each method options map
 * @description It must be an Option type used by the core. It should not be an Option type provided to the user.
 */
export interface BlueveryMethodOptions {
  scan: {
    /**
     * @description
     * Important: The seconds setting is a second, not a millisecond!
     */
    scanningSettings: BleManagerParams['scan'];
    /**
     * @description Important: this is millisecond. interval that scan between scan. default is `0` = no interval.
     */
    intervalLength: number;
    /**
     * @description count of interval iteration. default is `1` = only once scan.
     */
    iterations: number;
  };
  // Note: connectはiOSで失敗してもタイムアウトしないので、タイムアウトするようにする
  connect: ToBetterOptionsWithMustTimeout;
  // Note: retrieveServicesがpendingのままになるときがあるので、タイムアウトするようにする
  retrieveServices: ToBetterOptionsWithMustTimeout;
  read: ToBetterOptions & {
    advanceRetryCondition?: InspectorFn<typeof BleManager.read>;
  };
  write: ToBetterOptions;
  // Note: 無限にbondingして返ってこないケースがあるので、タイムアウトするようにする
  createBond: ToBetterOptionsWithMustTimeout;
  startNotification: {};
  stopNotification: {};
}
