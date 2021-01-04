import BleManager from 'react-native-ble-manager';
import promiseRetry, {Options as promiseRetryOptions} from 'p-retry';

export type WriteValueFn = (
  ...args: Parameters<typeof BleManager.write>
) => Promise<void>;

export type WriteValueParams = {
  writeValueParams: Parameters<typeof BleManager.write>;
  retryParams?: promiseRetryOptions;
};

export type TryWriteValueFn = (
  params: TryWriteValueParams,
) => ReturnType<WriteValueFn>;

export type TryWriteValueParams = Omit<WriteValueParams, 'retryParams'>;

/**
 * @description create for trying writeValue
 */
export function createTryWriteValueFn(
  writeValueFn: WriteValueFn,
): TryWriteValueFn {
  return async function ({writeValueParams}: TryWriteValueParams) {
    try {
      await writeValueFn(...writeValueParams);
    } catch (error) {
      throw new Error(error);
    }
  };
}

export async function writeValue(
  tryWriteValueFn: TryWriteValueFn,
  writeValueParams: WriteValueParams,
) {
  const {retryParams} = writeValueParams;
  await promiseRetry(() => tryWriteValueFn(writeValueParams), {
    retries: 5,
    factor: 1,
    ...retryParams,
  });
}
