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
  cancelableOptions?: CancelableOptions;
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

// FIXME: 返り値がcancelableかどうかをconditionalな型にしたい
export function toBetterPromise<ArgsType extends unknown[], ReturnValue>(
  fn: (...args: ArgsType) => PromiseLike<ReturnValue>,
  {retryOptions, timeoutOptions, cancelableOptions}: Options = {},
) {
  let pFn = fn;

  if (timeoutOptions) {
    pFn = toTimeoutPromise(pFn, timeoutOptions);
  }

  if (retryOptions) {
    pFn = toRetryPromise(pFn, retryOptions);
  }

  if (cancelableOptions) {
    pFn = toCancelablePromise(
      pFn,
      cancelableOptions.onCanceledHandler,
      cancelableOptions.shouldRejectOnCancel,
    );
  }

  return pFn;
}
