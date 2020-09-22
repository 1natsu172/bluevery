export type BlueveryOptions = {};

export type PeripheralId = string;
export type PeripheralInfo = {
  id: PeripheralId;
  name: string;
  connected: boolean;
};

export type CoreState = {
  bluetoothEnabled: boolean;
  permissionGranted: boolean;
  managing: boolean;
  scanning: boolean;
  connecting: boolean;
  peripherals: Map<PeripheralId, PeripheralInfo>;
  error: Error | undefined;
};
