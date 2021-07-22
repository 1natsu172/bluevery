import delay from 'delay';
import {CancelError} from 'p-cancelable';
import {TimeoutError} from 'p-timeout';
import {
  toCancelablePromise,
  toRetryPromise,
  toTimeoutPromise,
  toBetterPromise,
} from './toBetterPromise';
import {flushPromisesAdvanceTimersToNextTimer} from '../../__tests__/__utils__/flushPromisesAdvanceTimersToNextTimer';

beforeEach(() => {});

describe('toCancelablePromise', () => {
  test('should to be cancelable', () => {
    const onCanceledHandler = jest.fn();
    const pendingFn = toCancelablePromise(
      () => new Promise(() => {}),
      onCanceledHandler,
    )();

    expect(pendingFn.isCanceled).toBe(false);

    pendingFn.cancel();
    expect(onCanceledHandler).toBeCalledTimes(1);
    expect(pendingFn.isCanceled).toBe(true);
  });
  test('should reject on cancel', () => {
    const onCanceledHandler = jest.fn();
    const pendingFn = toCancelablePromise(
      () => new Promise(() => {}),
      onCanceledHandler,
    )();
    pendingFn.cancel();

    return expect(pendingFn).rejects.toBeInstanceOf(CancelError);
  });
  test('should not reject on cancel by option', async () => {
    const onCanceledHandler = jest.fn();
    const pendingFn = toCancelablePromise(
      () =>
        new Promise((resolve) => {
          setTimeout(resolve, 100);
        }),
      onCanceledHandler,
      false,
    )();
    pendingFn.cancel();

    await expect(pendingFn).resolves.not.toThrow();
  });
});

describe('toRetryPromise', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  test('should can be retry', async () => {
    const normalFn = jest.fn(() => Promise.reject(new Error('fixture')));
    const willBeRetryFn = toRetryPromise(normalFn, {
      retries: 2,
      factor: 1,
      onFailedAttempt: () => {
        flushPromisesAdvanceTimersToNextTimer();
      },
    });
    const triedFn = willBeRetryFn();
    await expect(triedFn).rejects.toThrow();
    expect(normalFn).toBeCalledTimes(3);
  });
});

describe('toTimeoutPromise', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  test('should  can be timeout', async () => {
    const mustPendingFn = () =>
      new Promise((resolve) => {
        setTimeout(() => {
          resolve('yeah');
        }, 10000);
      });
    const timeoutPromiseFn = toTimeoutPromise(mustPendingFn, {
      timeoutMilliseconds: 5000,
    });
    try {
      const foo = timeoutPromiseFn();
      jest.advanceTimersByTime(5000);
      await foo;
    } catch (error) {
      expect(error).toBeInstanceOf(TimeoutError);
    }
  });
});

describe('toBetterPromise', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    // clear mock count
    jest.clearAllMocks();
  });
  const mustPendingFn = jest.fn(
    (..._args: unknown[]) => new Promise((_resolve) => {}),
  );
  const mustRejectFn = jest.fn(() => Promise.reject(new Error('fixture')));
  // const mustResolveFn = jest.fn((...args: unknown[]) => Promise.resolve(args));
  const delayPromiseFn = jest.fn(
    (...args: unknown[]) =>
      new Promise((resolve, reject) => {
        delay(5000).then(() => resolve(args), reject);
      }),
  );

  test('should be cancelable', async () => {
    const cancelHandler = jest.fn();
    const betterPromise = toBetterPromise(mustPendingFn, {
      cancelableOptions: {
        onCanceledHandler: cancelHandler,
      },
      timeoutOptions: {
        timeoutMilliseconds: 10000,
      },
      retryOptions: {factor: 1, retries: 3},
    });

    const myPromise = betterPromise('lgtm');

    myPromise.cancel();

    await expect(myPromise).rejects.not.toBeInstanceOf(TimeoutError);
    await expect(myPromise).rejects.toBeInstanceOf(CancelError);
    expect(cancelHandler).toHaveBeenCalled();
  });

  test('should be timeout', async () => {
    const cancelHandler = jest.fn();

    const betterPromise = toBetterPromise(mustPendingFn, {
      cancelableOptions: {
        onCanceledHandler: cancelHandler,
      },
      timeoutOptions: {
        timeoutMilliseconds: 1000,
      },
      // retryOptions: {factor: 1, retries: 3},
    });

    try {
      const myPromise = betterPromise('lgtm');
      jest.advanceTimersByTime(1000);
      await myPromise;
    } catch (error) {
      expect(error).toBeInstanceOf(TimeoutError);
      expect(cancelHandler).not.toBeCalled();
    }
  });

  test('should be retry by timeout', async () => {
    const onFailed = jest.fn(() => {
      flushPromisesAdvanceTimersToNextTimer(1000);
    });

    const betterPromise = toBetterPromise(mustPendingFn, {
      cancelableOptions: {},
      timeoutOptions: {
        timeoutMilliseconds: 1000,
      },
      retryOptions: {factor: 1, retries: 2, onFailedAttempt: onFailed},
    });

    try {
      const my = betterPromise('lgtm');
      jest.advanceTimersByTime(1000);
      await my;
    } catch (error) {
      expect(error).not.toBeInstanceOf(CancelError);
      expect(error).toBeInstanceOf(TimeoutError);
      expect(mustPendingFn).toBeCalledTimes(3);
    }
  });

  test('should be retry by original reject', async () => {
    const onFailed = jest.fn(() => {
      flushPromisesAdvanceTimersToNextTimer();
    });

    const betterPromise = toBetterPromise(mustRejectFn, {
      cancelableOptions: {},
      timeoutOptions: {
        timeoutMilliseconds: 1000,
      },
      retryOptions: {factor: 1, retries: 2, onFailedAttempt: onFailed},
    });

    try {
      const my = betterPromise();
      await my;
    } catch (error) {
      expect(error).not.toBeInstanceOf(CancelError);
      expect(error).not.toBeInstanceOf(TimeoutError);
      expect(error).toEqual(Error('fixture'));
      expect(mustRejectFn).toBeCalledTimes(3);
    }
  });

  test('should be resolve', async () => {
    const onCanceledHandler = jest.fn();
    const onFailedAttempt = jest.fn();
    const betterPromise = toBetterPromise(delayPromiseFn, {
      cancelableOptions: {
        onCanceledHandler,
      },
      timeoutOptions: {
        timeoutMilliseconds: 10000,
      },
      retryOptions: {factor: 1, retries: 2, onFailedAttempt},
    });
    const myPromise = betterPromise('lgtm');
    jest.advanceTimersByTime(5000);
    await expect(myPromise).resolves.toStrictEqual(['lgtm']);
    expect(onCanceledHandler).not.toBeCalled();
    expect(onFailedAttempt).not.toBeCalled();
  });
});
