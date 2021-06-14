import React from 'react';
import {useErrorHandler} from 'react-error-boundary';
import {useAND_UC_352BLE} from './hooks';
import {BaseBleServiceScreen} from './BaseBleServiceScreen';

export const AND_UC_352BLEScreen = () => {
  const handleError = useErrorHandler();
  const bleController = useAND_UC_352BLE({onError: handleError});
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
