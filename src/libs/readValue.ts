import BleManager from 'react-native-ble-manager';
import promiseRetry, {Options as promiseRetryOptions} from 'p-retry';

export type ReadValueFn = (
  ...args: Parameters<typeof BleManager.read>
) => Promise<void>;

export type ReadValueParams = {
  readValueParams: Parameters<typeof BleManager.read>;
  retryParams?: promiseRetryOptions;
};

export type TryReadValueFn = (
  params: TryReadValueParams,
) => ReturnType<ReadValueFn>;

export type TryReadValueParams = Omit<ReadValueParams, 'retryParams'>;

/**
 * @description create for trying readValue
 */
export function createTryReadValueFn(readValueFn: ReadValueFn): TryReadValueFn {
  return async function ({readValueParams}: TryReadValueParams) {
    try {
      await readValueFn(...readValueParams);
    } catch (error) {
      throw new Error(error);
    }
  };
}

export async function readValue(
  tryReadValueFn: TryReadValueFn,
  readValueParams: ReadValueParams,
) {
  const {retryParams} = readValueParams;
  return await promiseRetry(() => tryReadValueFn(readValueParams), {
    retries: 5,
    factor: 1,
    ...retryParams,
  });
}
