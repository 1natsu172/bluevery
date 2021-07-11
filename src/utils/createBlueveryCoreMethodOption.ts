import deepmerge from 'deepmerge';
import {BlueveryCoreMethodOptions} from '../interface';
import {DEFAULT_OMOIYARI_TIME} from '../constants';

export const defaultBlueveryCoreMethodOptions: BlueveryCoreMethodOptions = {
  scan: {
    scanningSettings: [[], 3, true],
    intervalLength: 0,
    iterations: 1,
  },
  retrieveServices: {
    retryOptions: {factor: 1, retries: 4},
    timeoutOptions: {timeoutMilliseconds: 5000},
    omoiyariTime: DEFAULT_OMOIYARI_TIME,
  },
  connect: {
    retryOptions: {factor: 1, retries: 4},
    timeoutOptions: {timeoutMilliseconds: 8000},
    omoiyariTime: DEFAULT_OMOIYARI_TIME,
  },
  createBond: {
    retryOptions: {factor: 1, retries: 4},
    timeoutOptions: {timeoutMilliseconds: 10000},
    omoiyariTime: DEFAULT_OMOIYARI_TIME,
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

export function createBlueveryCoreMethodOption<
  MethodName extends keyof BlueveryCoreMethodOptions
>(
  methodName: MethodName,
  overrideOptions:
    | Partial<BlueveryCoreMethodOptions[typeof methodName]>
    | undefined,
) {
  return deepmerge<BlueveryCoreMethodOptions[typeof methodName]>(
    defaultBlueveryCoreMethodOptions[methodName],
    overrideOptions || {},
    // @see https://github.com/TehShrike/deepmerge#arraymerge-example-overwrite-target-array
    {arrayMerge: (_destinationArray, sourceArray, _options) => sourceArray},
  );
}
