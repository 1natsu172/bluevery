import {useCallback, useState} from 'react';
import {bluevery, PeripheralId, PeripheralInfo} from 'bluevery';
import {BleController} from './type';

export const BP_SERVICE_UUID = '180f';
/**
 * BLE(GATT)のキャラクタリスティックUUID: バッテリーレベル
 */
export const BP_BATTERY_LEVEL_CHARECTERISTIC_UUID = '2a19';

/**
 * hook for Battery Service
 */
type Props = {
  onError: (error: Error) => unknown;
};
export const useBatteryService: (props: Props) => BleController = ({
  onError,
}: Props) => {
  const [characteristicValues, setCharacteristicValues] = useState<
    {
      [K in PeripheralId]: unknown[];
    }
  >({});

  const onConnectPeripheral = useCallback(
    async (peripheralInfo: PeripheralInfo) => {
      try {
        await bluevery.connect({
          connectParams: [peripheralInfo.id],
          retrieveServicesParams: [peripheralInfo.id],
          bondingParams: [peripheralInfo.id, peripheralInfo.id],
        });
        const value = await bluevery.readValue({
          readValueParams: [
            peripheralInfo.id,
            BP_SERVICE_UUID,
            BP_BATTERY_LEVEL_CHARECTERISTIC_UUID,
          ],
          retrieveServicesParams: [peripheralInfo.id],
        });
        //console.log('value: ', value);
        setCharacteristicValues((prev) => {
          return {
            ...prev,
            [peripheralInfo.id]: [...(prev[peripheralInfo.id] || []), value],
          };
        });
      } catch (error) {
        onError(error);
      }
    },
    [onError],
  );
  return {
    onConnectPeripheral,
    characteristicValues,
    receiveCharacteristicValueHandlers: undefined,
  };
};
