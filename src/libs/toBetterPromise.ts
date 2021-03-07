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

type Options = {
  retryOptions?: RetryOptions;
  timeoutOptions?: TimeoutOptions;
  cancelableOptions?: undefined;
};
type OptionsWithCancelable = {
  retryOptions?: RetryOptions;
  timeoutOptions?: TimeoutOptions;
  cancelableOptions: CancelableOptions;
};

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
  options: Options,
): (...args: ArgsType) => PromiseLike<ReturnValue>;
/**
 * overload type when cancelable
 */
export function toBetterPromise<ArgsType extends unknown[], ReturnValue>(
  fn: (...args: ArgsType) => PromiseLike<ReturnValue>,
  options: OptionsWithCancelable,
): (...args: ArgsType) => pCancelable<ReturnValue>;
/**
 * overload implement
 */
export function toBetterPromise<ArgsType extends unknown[], ReturnValue>(
  fn: (...args: ArgsType) => PromiseLike<ReturnValue>,
  options: Options | OptionsWithCancelable = {},
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
