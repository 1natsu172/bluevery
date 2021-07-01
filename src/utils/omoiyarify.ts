import delay from 'delay';
import pTap from 'p-tap';

// async function omoiyarify<T>(
//   fn: () => PromiseLike<T> | T,
//   {time}: {time: number},
// ) {
//   return Promise.resolve()
//     .then(fn)
//     .then(pTap(() => delay(time)));
// }

/**
 * @description mock for testing, reason so actual module is use promise delay(setTimeout).
 */
export function mockOmoiyarify<ArgsType extends unknown[], ReturnValue>(
  fn: (...args: ArgsType) => PromiseLike<ReturnValue> | ReturnValue,
) {
  return (...args: ArgsType) =>
    Promise.resolve()
      .then(() => fn(...args))
      .then(pTap(() => {}));
}

function omoiyarify<ArgsType extends unknown[], ReturnValue>(
  fn: (...args: ArgsType) => PromiseLike<ReturnValue> | ReturnValue,
  {time}: {time: number},
) {
  return (...args: ArgsType) =>
    Promise.resolve()
      .then(() => fn(...args))
      .then(pTap(() => delay(time)));
}

export {omoiyarify, omoiyarify as applyOmoiyari};
