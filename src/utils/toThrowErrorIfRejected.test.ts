import {toThrowErrorIfRejected} from './toThrowErrorIfRejected';

beforeEach(() => {});

describe('toThrowErrorIfRejected', () => {
  test('should throw Error Object when rejected', async () => {
    const pFn = toThrowErrorIfRejected(() => Promise.reject('fixture'));
    const called = pFn();
    await expect(called).rejects.toThrowError();
    await expect(called).rejects.toBeInstanceOf(Error);
  });

  test('should return value when fulfilled', async () => {
    const pFn = toThrowErrorIfRejected(() => Promise.resolve('fixture'));
    const called = pFn();
    await expect(called).resolves.toBe('fixture');
  });

  test('should call by passed args', async () => {
    const pFn = toThrowErrorIfRejected((...args: unknown[]) =>
      Promise.resolve(args),
    );
    const called = pFn('lgtm', 'lgtm2');
    await expect(called).resolves.toStrictEqual(['lgtm', 'lgtm2']);
  });
});
