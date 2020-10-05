import BleManager, {Peripheral} from 'react-native-ble-manager';

export type BlueveryOptions = {};

export type PeripheralId = string;
export type PeripheralInfo = Peripheral & {
  connected?: boolean;
};

export type State = {
  bluetoothEnabled: boolean;
  permissionGranted: boolean;
  managing: boolean;
  scanning: boolean;
  connecting: boolean;
  peripherals: Map<PeripheralId, PeripheralInfo>;
  error: Error | undefined;
};

export type BlueveryEvents = 'didChangeBlueveryState';

/**
 * options
 */
export type ScanningSettings = Parameters<typeof BleManager.scan>;
