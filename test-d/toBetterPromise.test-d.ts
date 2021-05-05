import pCancelable from 'p-cancelable';
import {expectType, expectAssignable, expectNotAssignable} from 'tsd';
import {
  toBetterPromise,
  ToBetterOptions,
  ToBetterOptionsWithMustTimeout,
} from '../dist/utils/toBetterPromise';

/**
 * Testing for: toBetterPromise return Types
 */
expectType<() => Promise<number>>(
  toBetterPromise(() => Promise.resolve(10), {}),
);

// should return cancelable, if pass cancelableOptions
expectType<() => pCancelable<number>>(
  toBetterPromise(() => Promise.resolve(10), {cancelableOptions: {}}),
);

///////////////////////////////////////

/**
 * Testing for: ToBetterOptions type
 */
expectNotAssignable<ToBetterOptions>({foo: 1});
expectAssignable<ToBetterOptions>({});
expectAssignable<ToBetterOptions>({timeoutOptions: {timeoutMilliseconds: 100}});
expectAssignable<ToBetterOptions>({retryOptions: {retries: 3}});
expectAssignable<ToBetterOptions>({
  cancelableOptions: {onCanceledHandler: () => {}},
});
expectAssignable<ToBetterOptions>({
  timeoutOptions: {timeoutMilliseconds: 100},
  retryOptions: {retries: 3},
  cancelableOptions: {onCanceledHandler: () => {}},
});

/**
 * Testing for: ToBetterOptionsWithMustTimeout type
 */
expectAssignable<ToBetterOptionsWithMustTimeout>({
  timeoutOptions: {timeoutMilliseconds: 100},
});
expectAssignable<ToBetterOptionsWithMustTimeout>({
  timeoutOptions: {timeoutMilliseconds: 100},
  retryOptions: {retries: 3},
});
expectNotAssignable<ToBetterOptionsWithMustTimeout>({});
expectNotAssignable<ToBetterOptionsWithMustTimeout>({
  retryOptions: {retries: 3},
});
