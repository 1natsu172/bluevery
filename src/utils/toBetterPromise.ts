import pRetry, {Options as RetryOptions} from 'p-retry';
import pTimeout from 'p-timeout';
import pCancelable, {OnCancelFunction} from 'p-cancelable';

type TimeoutOptions = {
  timeoutMilliseconds: number;
  timeoutMessage?: string | Error;
};

type CancelableOptions = {
  onCanceledHandler?: () => void;
  shouldRejectOnCancel?: OnCancelFunction['shouldReject'];
};

type BetterOptions = {
  retryOptions?: RetryOptions;
  timeoutOptions?: TimeoutOptions;
  cancelableOptions?: undefined;
};
type BetterOptionsWithCancelable = {
  retryOptions?: RetryOptions;
  timeoutOptions?: TimeoutOptions;
  cancelableOptions: CancelableOptions;
};

export type ToBetterOptions = BetterOptions | BetterOptionsWithCancelable;

export const toCancelablePromise = <ArgsType extends unknown[], ReturnValue>(
  fn: (...args: ArgsType) => PromiseLike<ReturnValue>,
  onCanceledHandler: () => void = () => {},
  shouldRejectOnCancel: boolean = true,
) => {
  return (...arguments_: ArgsType) => {
    return new pCancelable<ReturnValue>((resolve, reject, onCancel) => {
      if (shouldRejectOnCancel === false) {
        onCancel.shouldReject = false;
      }
      onCancel(onCanceledHandler);
      return fn(...arguments_).then(resolve, reject);
    });
  };
};

export const toTimeoutPromise = <ArgsType extends unknown[], ReturnValue>(
  fn: (...args: ArgsType) => PromiseLike<ReturnValue>,
  timeoutOptions: TimeoutOptions,
) => {
  return (...arguments_: ArgsType) => {
    return pTimeout(
      fn(...arguments_),
      timeoutOptions.timeoutMilliseconds,
      timeoutOptions.timeoutMessage,
    );
  };
};

export const toRetryPromise = <ArgsType extends unknown[], ReturnValue>(
  fn: (...args: ArgsType) => PromiseLike<ReturnValue>,
  retryOptions: RetryOptions,
) => {
  return (...arguments_: ArgsType) => {
    return pRetry(() => fn(...arguments_), retryOptions);
  };
};

/**
 * overload type when nonCancelable
 */
export function toBetterPromise<ArgsType extends unknown[], ReturnValue>(
  fn: (...args: ArgsType) => PromiseLike<ReturnValue>,
  options: BetterOptions,
): (...args: ArgsType) => PromiseLike<ReturnValue>;
/**
 * overload type when cancelable
 */
export function toBetterPromise<ArgsType extends unknown[], ReturnValue>(
  fn: (...args: ArgsType) => PromiseLike<ReturnValue>,
  options: BetterOptionsWithCancelable,
): (...args: ArgsType) => pCancelable<ReturnValue>;
/**
 * overload total variation
 */
export function toBetterPromise<ArgsType extends unknown[], ReturnValue>(
  fn: (...args: ArgsType) => PromiseLike<ReturnValue>,
  options: ToBetterOptions,
): (...args: ArgsType) => PromiseLike<ReturnValue> | pCancelable<ReturnValue>;
/**
 * overload implement
 */
export function toBetterPromise<ArgsType extends unknown[], ReturnValue>(
  fn: (...args: ArgsType) => PromiseLike<ReturnValue>,
  options: ToBetterOptions = {},
) {
  const {timeoutOptions, retryOptions, cancelableOptions} = options;

  let bFn = fn;

  if (timeoutOptions) {
    bFn = toTimeoutPromise(bFn, timeoutOptions);
  }

  if (retryOptions) {
    bFn = toRetryPromise(bFn, retryOptions);
  }

  if (cancelableOptions) {
    bFn = toCancelablePromise(
      bFn,
      cancelableOptions.onCanceledHandler,
      cancelableOptions.shouldRejectOnCancel,
    );
  }

  return bFn;
}
