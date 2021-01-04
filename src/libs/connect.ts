import BleManager from 'react-native-ble-manager';
import promiseRetry, {Options as promiseRetryOptions} from 'p-retry';

export type ConnectFn = (
  ...args: Parameters<typeof BleManager.connect>
) => Promise<void>;

export type ConnectParams = {
  connectParams: Parameters<typeof BleManager.connect>;
  retryParams?: promiseRetryOptions;
};

export type TryConnectFn = (params: TryConnectParams) => ReturnType<ConnectFn>;

export type TryConnectParams = Omit<ConnectParams, 'retryParams'>;

/**
 * @description create for trying connect
 */
export function createTryConnectFn(connectFn: ConnectFn): TryConnectFn {
  return async function ({connectParams}: TryConnectParams) {
    try {
      await connectFn(...connectParams);
    } catch (error) {
      throw new Error(error);
    }
  };
}

export async function connect(
  tryConnectFn: TryConnectFn,
  connectParams: ConnectParams,
) {
  const {retryParams} = connectParams;
  await promiseRetry(() => tryConnectFn(connectParams), {
    retries: 5,
    factor: 1,
    ...retryParams,
  });
}
