import {toInspectPromiseReturnValue} from './toInspectPromiseReturnValue';

describe('toInspectPromiseReturnValue', () => {
  const willResolvePFn = (willReturnValue: any) =>
    Promise.resolve(willReturnValue);
  const willRejectPFn = (_willRejectValue: any) =>
    Promise.reject(new Error('fixture error'));

  test('should return the return value as is, if pass inspection', async () => {
    const condition = (ret: any): never | void => {
      if (ret < 10) {
        throw Error('return value is not pass');
      }
    };
    await expect(
      toInspectPromiseReturnValue(willResolvePFn, condition)(10),
    ).resolves.toBe(10);
  });

  test('should throw Error, if failed inspection', async () => {
    const condition = (ret: any): never | void => {
      if (ret < 10) {
        throw Error('return value is not pass');
      }
    };
    await expect(
      toInspectPromiseReturnValue(willResolvePFn, condition)(9),
    ).rejects.toThrowError('return value is not pass');
  });

  test('should throw Error as is, if an error occurs before inspection', async () => {
    const condition = (ret: any): never | void => {
      if (ret < 10) {
        throw Error('return value is not pass');
      }
    };

    await expect(
      toInspectPromiseReturnValue(willRejectPFn, condition)(10),
    ).rejects.toThrow('fixture error');
  });

  test('should allow inspectorFn to be missing', async () => {
    await expect(toInspectPromiseReturnValue(willResolvePFn)(10)).resolves.toBe(
      10,
    );
  });
});
