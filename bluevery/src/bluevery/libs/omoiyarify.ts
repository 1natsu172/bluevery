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
