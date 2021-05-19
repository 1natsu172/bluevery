import {useCallback, useState} from 'react';
import {bluevery, PeripheralId, PeripheralInfo} from 'bluevery';
import {BleController} from './type';

export const BP_MONITOR_NAME_AND = 'A&D_UA-651BLE';
export const BP_SERVICE_UUID = '1810';
/**
 * BLE(GATT)のキャラクタリスティックUUID: タイムスタンプ
 */
export const BP_DATETIME_CHARECTERISTIC_UUID = '2a08';
/**
 * BLE(GATT)のキャラクタリスティックUUID: 血圧測定データ
 */
export const BP_MEASUREMENT_CHARECTERISTIC_UUID = '2a35';

/**
 * Dateを以下の形式のbyte arrayに変換する
 * |year (16bit)|month(8bit)|day(8bit)|hours(8bit)|minutes(8bit)|seconds(8bit)|
 */
export const timeToByteArray = (d: Date) => {
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const hours = d.getHours();
  const minutes = d.getMinutes();
  const seconds = d.getSeconds();
  const yearData = new Uint8Array(new Uint16Array([year]).buffer); // 16bit -> 8bit array

  const otherData = new Uint8Array([month, day, hours, minutes, seconds]);
  return [...Array.from(yearData), ...Array.from(otherData)];
};

/**
 * hook for A&D_UA-651BLE
 */
type Props = {
  onError: (error: Error) => unknown;
};
export const useAND_UA_651BLE: (props: Props) => BleController = ({
  onError,
}: Props) => {
  const [characteristicValues, setCharacteristicValues] = useState<
    {
      [K in PeripheralId]: unknown[];
    }
  >({});

  const onReceiveCharacteristicValue = useCallback(
    async (peripheralInfo: PeripheralInfo) => {
      try {
        await bluevery.receiveCharacteristicValue({
          onCallBeforeStartNotification: async () => {
            await bluevery.connect({
              connectParams: [peripheralInfo.id],
              retrieveServicesParams: [peripheralInfo.id],
              retrieveServicesOptions: {
                retryOptions: {retries: 15},
                timeoutOptions: {timeoutMilliseconds: 10000},
              },
              bondingParams: [peripheralInfo.id, peripheralInfo.id],
            });
            await bluevery.writeValue({
              writeValueParams: [
                peripheralInfo.id,
                BP_SERVICE_UUID,
                BP_DATETIME_CHARECTERISTIC_UUID,
                timeToByteArray(new Date()),
              ],
              retrieveServicesParams: [peripheralInfo.id],
            });
            await bluevery.readValue({
              readValueParams: [
                peripheralInfo.id,
                BP_SERVICE_UUID,
                BP_DATETIME_CHARECTERISTIC_UUID,
              ],
              retrieveServicesParams: [peripheralInfo.id],
            });
          },
          scanParams: {
            scanOptions: {
              scanningSettings: [[], 1, true],
            },
          },
          retrieveServicesParams: [peripheralInfo.id],
          retrieveServicesOptions: {
            retryOptions: {retries: 15},
            timeoutOptions: {timeoutMilliseconds: 10000},
          },
          startNotificationParams: [
            peripheralInfo.id,
            BP_SERVICE_UUID,
            BP_MEASUREMENT_CHARECTERISTIC_UUID,
          ],
          receiveCharacteristicHandler: (res) => {
            console.log('global subscribed: receiveCharacteristic', {...res});
            if (
              res.peripheral === peripheralInfo.id &&
              res.service.includes(BP_SERVICE_UUID) &&
              res.characteristic.includes(BP_MEASUREMENT_CHARECTERISTIC_UUID)
            ) {
              console.log(
                `match the ${peripheralInfo.id} / ${BP_SERVICE_UUID} / ${BP_MEASUREMENT_CHARECTERISTIC_UUID}`,
                res.value,
              );
              setCharacteristicValues((prev) => {
                return {
                  ...prev,
                  [res.peripheral]: [
                    ...(prev[res.peripheral] || []),
                    res.value,
                  ],
                };
              });
            }
          },
        });
      } catch (error) {
        onError(error);
      }
    },
    [],
  );

  const onConnectPeripheral = useCallback(
    async (peripheralInfo: PeripheralInfo) => {
      try {
        await bluevery.connect({
          connectParams: [peripheralInfo.id],
          retrieveServicesParams: [peripheralInfo.id],
          bondingParams: [peripheralInfo.id, peripheralInfo.id],
        });
        await bluevery.writeValue({
          writeValueParams: [
            peripheralInfo.id,
            BP_SERVICE_UUID,
            BP_DATETIME_CHARECTERISTIC_UUID,
            timeToByteArray(new Date()),
          ],
          retrieveServicesParams: [peripheralInfo.id],
        });
        await bluevery.readValue({
          readValueParams: [
            peripheralInfo.id,
            BP_SERVICE_UUID,
            BP_DATETIME_CHARECTERISTIC_UUID,
          ],
          retrieveServicesParams: [peripheralInfo.id],
        });
      } catch (error) {
        onError(error);
      }
    },
    [],
  );

  return {
    receiveCharacteristicValueHandlers: {
      [BP_MONITOR_NAME_AND]: {
        name: BP_MONITOR_NAME_AND,
        onReceiveCharacteristicValue,
      },
    },
    onConnectPeripheral,
    characteristicValues,
  };
};
