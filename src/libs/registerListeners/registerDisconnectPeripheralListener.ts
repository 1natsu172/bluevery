import {EmitterSubscription, NativeEventEmitter} from 'react-native';

/**
 * @description peripheral is peripheral id
 * @description status is Android only
 */
export type DisconnectedPeripheralInfo = {
  peripheral: string; // this is peripheral id
  status: number; // Android only
};

export type DisconnectedPeripheralHandler = (
  disconnectInfo: DisconnectedPeripheralInfo,
) => unknown;

export const createHandleDisconnectPeripheral = ({
  onDisconnectPeripheral,
  optionalOnDisconnectPeripheral,
}: {
  onDisconnectPeripheral: DisconnectedPeripheralHandler;
  optionalOnDisconnectPeripheral?: DisconnectedPeripheralHandler;
}): DisconnectedPeripheralHandler => (disconnectInfo) => {
  onDisconnectPeripheral(disconnectInfo);
  optionalOnDisconnectPeripheral &&
    optionalOnDisconnectPeripheral(disconnectInfo);
};

export function registerDisconnectPeripheralListener(
  bleManagerEmitter: NativeEventEmitter,
  handleDisconnectPeripheral: DisconnectedPeripheralHandler,
): EmitterSubscription {
  return bleManagerEmitter.addListener(
    'BleManagerDisconnectPeripheral',
    handleDisconnectPeripheral,
  );
}
