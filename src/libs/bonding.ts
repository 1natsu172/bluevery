import {Platform} from 'react-native';
import BleManager from 'react-native-ble-manager';
import promiseRetry, {Options as promiseRetryOptions} from 'p-retry';

export type BondFn = (
  ...args: Parameters<typeof BleManager.createBond>
) => Promise<void>;

export type BondingParams = {
  createBondParams: Parameters<typeof BleManager.createBond>;
  retryParams?: promiseRetryOptions;
};

export type TryBondFn = (params: TryBondParams) => ReturnType<BondFn>;

export type TryBondParams = Omit<BondingParams, 'retryParams'>;

export function createTryBondFn(bondFn: BondFn): TryBondFn {
  return async function ({createBondParams}: TryBondParams) {
    try {
      await bondFn(...createBondParams);
    } catch (error) {
      throw new Error(error);
    }
  };
}

/**
 * @description use for after connect that for bond. support only android.
 */
export async function bonding(
  tryBondFn: TryBondFn,
  {createBondParams, retryParams}: BondingParams,
) {
  if (Platform.OS === 'android') {
    await promiseRetry(() => tryBondFn({createBondParams}), {
      retries: 5,
      factor: 1,
      ...retryParams,
    });
  }
}
