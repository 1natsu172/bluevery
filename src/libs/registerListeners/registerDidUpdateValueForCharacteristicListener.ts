import {EmitterSubscription, NativeEventEmitter} from 'react-native';

type CallbackArgs = {
  value: Array<unknown>;
  peripheral: string;
  characteristic: string;
  service: string;
};

export function registerDidUpdateValueForCharacteristicListener(
  bleManagerEmitter: NativeEventEmitter,
  handleDidUpdateValueForCharacteristic: (args: CallbackArgs) => unknown,
): EmitterSubscription {
  return bleManagerEmitter.addListener(
    'BleManagerDidUpdateValueForCharacteristic',
    handleDidUpdateValueForCharacteristic,
  );
}
