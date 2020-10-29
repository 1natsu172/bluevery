import {omoiyarify} from './omoiyarify';
import inRange from 'in-range';
import timeSpan from 'time-span';

describe('omoiyari', () => {
  const fn = (...args: unknown[]) =>
    args.length ? `passed: ${args.join(', ')}` : 'omoiyarity';
  const promiseFn = (...args: unknown[]) =>
    new Promise((resolve) => {
      setTimeout(() => {
        resolve(args.length ? `p-passed: ${args.join(', ')}` : 'p-omoiyarity');
      }, 50);
    });

  test('function called then delayed the time.', async () => {
    const end = timeSpan();
    const omoiyariFn = omoiyarify(fn, {time: 50});
    await omoiyariFn();
    expect(inRange(end(), {start: 30, end: 70})).toBeTruthy();
  });

  test('promise function called then delayed the time.', async () => {
    const end = timeSpan();
    const omoiyariPromiseFn = omoiyarify(promiseFn, {time: 50});
    await omoiyariPromiseFn();
    expect(inRange(end(), {start: 90, end: 120})).toBeTruthy();
  });

  test('return value by function', async () => {
    const omoiyariFn = omoiyarify(fn, {time: 50});
    const ret = await omoiyariFn();
    expect(ret).toBe('omoiyarity');
  });

  test('return value by promise function', async () => {
    const omoiyariPromiseFn = omoiyarify(promiseFn, {time: 50});
    const ret = await omoiyariPromiseFn();
    expect(ret).toEqual('p-omoiyarity');
  });

  test('can pass args to function', async () => {
    const omoiyariFn = omoiyarify(fn, {
      time: 50,
    });
    const omoiyariPromiseFn = omoiyarify(promiseFn, {
      time: 50,
    });
    const ret = await omoiyariFn(1, 2, 3, 4);
    const pRet = await omoiyariPromiseFn('l', 'g', 't', 'm');
    expect(ret).toEqual('passed: 1, 2, 3, 4');
    expect(pRet).toEqual('p-passed: l, g, t, m');
  });
});
