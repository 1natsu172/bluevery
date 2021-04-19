import {EmitterSubscription, NativeEventEmitter} from 'react-native';

export type CallbackArgs = {
  value: Array<unknown>;
  peripheral: string;
  characteristic: string;
  service: string;
};

export type HandleDidUpdateValueForCharacteristic = (
  args: CallbackArgs,
) => unknown;

export function registerDidUpdateValueForCharacteristicListener(
  bleManagerEmitter: NativeEventEmitter,
  handleDidUpdateValueForCharacteristic: HandleDidUpdateValueForCharacteristic,
): EmitterSubscription {
  return bleManagerEmitter.addListener(
    'BleManagerDidUpdateValueForCharacteristic',
    handleDidUpdateValueForCharacteristic,
  );
}
