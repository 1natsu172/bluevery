import BleManager from 'react-native-ble-manager';
import promiseTimeout from 'p-timeout';
import promiseRetry, {Options as promiseRetryOptions} from 'p-retry';

export type RetrieveServicesFn = (
  ...args: Parameters<typeof BleManager.retrieveServices>
) => Promise<BleManager.PeripheralInfo>;

export type RetrieveServicesParams = {
  retrieveServicesParams: Parameters<typeof BleManager.retrieveServices>;
  retryParams?: promiseRetryOptions;
  timeoutMilliseconds?: number;
};

export type TryRetrieveServicesFn = (
  params: TryRetrieveServicesParams,
) => ReturnType<RetrieveServicesFn>;

export type TryRetrieveServicesParams = Omit<
  RetrieveServicesParams,
  'retryParams'
>;

/**
 * @description retrieveServices with timeout
 * @default timeoutMilliseconds = 2000ms
 */
export function createTryRetrieveServicesFn(
  retrieveServicesFn: RetrieveServicesFn,
): TryRetrieveServicesFn {
  return async function ({
    retrieveServicesParams,
    timeoutMilliseconds = 2000,
  }: TryRetrieveServicesParams) {
    const tryingRetrieveServices = promiseTimeout(
      retrieveServicesFn(...retrieveServicesParams),
      timeoutMilliseconds,
      'timeout: retrieveServices',
    );
    return await tryingRetrieveServices;
  };
}

export async function retrieveServices(
  tryRetrieveServicesFn: TryRetrieveServicesFn,
  retrieveServicesParams: RetrieveServicesParams,
) {
  const {retryParams} = retrieveServicesParams;
  await promiseRetry(() => tryRetrieveServicesFn(retrieveServicesParams), {
    retries: 5,
    factor: 1,
    ...retryParams,
  });
}
