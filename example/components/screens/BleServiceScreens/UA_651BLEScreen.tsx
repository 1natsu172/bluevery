import React from 'react';
import {useErrorHandler} from 'react-error-boundary';
import {useAND_UA_651BLE} from './hooks';
import {BaseBleServiceScreen} from './BaseBleServiceScreen';

export const UA_651BLEScreen = () => {
  const handleError = useErrorHandler();
  const bleController = useAND_UA_651BLE({onError: handleError});
  return (
    <BaseBleServiceScreen
      onError={handleError}
      onConnectPeripheral={bleController.onConnectPeripheral}
      characteristicValues={bleController.characteristicValues}
      receiveCharacteristicValueHandlers={
        bleController.receiveCharacteristicValueHandlers
      }
    />
  );
};
