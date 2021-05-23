import React from 'react';
import {useErrorHandler} from 'react-error-boundary';
import {useBatteryService} from './hooks';
import {BaseBleServiceScreen} from './BaseBleServiceScreen';

export const BatteryServiceScreen = () => {
  const handleError = useErrorHandler();
  const bleController = useBatteryService({onError: handleError});
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
