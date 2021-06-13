/* eslint-disable no-shadow */
import {EmitterSubscription, NativeEventEmitter} from 'react-native';
import {Peripheral} from 'react-native-ble-manager';
import {PeripheralInfo} from '../../interface';
import {debugBlueveryListener} from '../../utils';

export const createPeripheralInfoHandler = ({
  setPeripheralToScannedPeripherals,
  handlePeripheralInfo,
}: {
  setPeripheralToScannedPeripherals: (
    peripheralInfo: PeripheralInfo,
  ) => unknown;
  handlePeripheralInfo?: (peripheralInfo: PeripheralInfo) => unknown;
}) => (peripheralInfo: PeripheralInfo) => {
  // set peripheral to state.
  setPeripheralToScannedPeripherals(peripheralInfo);
  // call passed handler by user.
  handlePeripheralInfo && handlePeripheralInfo(peripheralInfo);
};

export const onDiscoverPeripheral = (
  peripheral: Peripheral,
  peripheralInfoHandler: (peripheralInfo: PeripheralInfo) => unknown,
) => {
  debugBlueveryListener('onDiscoverPeripheral: got peripehral', peripheral);

  const peripheralInfo: PeripheralInfo = peripheral;
  if (!peripheralInfo.name) {
    peripheralInfo.name = 'NO NAME';
  }
  peripheralInfoHandler(peripheralInfo);
};
type OnDiscoverPeripheral = typeof onDiscoverPeripheral;

export const createHandleDiscoverPeripheral = (
  onDiscoverPeripheral: OnDiscoverPeripheral,
  {
    matchFn,
    peripheralInfoHandler,
  }: {
    matchFn?: (peripheral: Peripheral) => boolean;
    peripheralInfoHandler: (peripheral: PeripheralInfo) => unknown;
  },
) => (peripheral: Peripheral) => {
  if (matchFn && !matchFn(peripheral)) {
    return;
  }
  onDiscoverPeripheral(peripheral, peripheralInfoHandler);
};

export function registerDiscoverPeripheralListener(
  bleManagerEmitter: NativeEventEmitter,
  handleDiscoverPeripheral: (peripheral: Peripheral) => unknown,
): EmitterSubscription {
  return bleManagerEmitter.addListener(
    'BleManagerDiscoverPeripheral',
    handleDiscoverPeripheral,
  );
}
