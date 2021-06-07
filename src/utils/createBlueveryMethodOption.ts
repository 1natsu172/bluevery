import deepmerge from 'deepmerge';
import {BlueveryMethodOptions} from '../interface';

export const defaultBlueveryMethodOptions: BlueveryMethodOptions = {
  scan: {
    scanningSettings: [[], 3, true],
    intervalLength: 0,
    iterations: 1,
  },
  retrieveServices: {
    retryOptions: {factor: 1, retries: 4},
    timeoutOptions: {timeoutMilliseconds: 5000},
  },
  connect: {
    retryOptions: {factor: 1, retries: 4},
    timeoutOptions: {timeoutMilliseconds: 8000},
  },
  createBond: {
    retryOptions: {factor: 1, retries: 4},
    timeoutOptions: {timeoutMilliseconds: 10000},
  },
  read: {
    retryOptions: {factor: 1, retries: 4},
  },
  write: {
    retryOptions: {factor: 1, retries: 4},
  },
  startNotification: {},
  stopNotification: {},
};

export function createBlueveryMethodOption<
  MethodName extends keyof BlueveryMethodOptions
>(
  methodName: MethodName,
  overrideOptions:
    | Partial<BlueveryMethodOptions[typeof methodName]>
    | undefined,
) {
  return deepmerge<BlueveryMethodOptions[typeof methodName]>(
    defaultBlueveryMethodOptions[methodName],
    overrideOptions || {},
  );
}
