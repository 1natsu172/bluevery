import {AsyncReturnType} from 'type-fest';

type PFn<ArgsType extends unknown[], ReturnValue> = (
  ...args: ArgsType
) => Promise<ReturnValue>;

export function toInspectPromiseReturnValue<
  ArgsType extends unknown[],
  ReturnValue
>(
  pFn: PFn<ArgsType, ReturnValue>,
  inspectorFn?: (ret: ReturnValue) => never | void,
): PFn<ArgsType, ReturnValue> {
  return async function (...fnParams) {
    try {
      const ret = await pFn(...fnParams);
      inspectorFn?.(ret);
      return ret;
    } catch (error) {
      throw new Error(error);
    }
  };
}

type AsyncFunction = (...args: any[]) => Promise<unknown>;
export type InspectorFn<ExecFn extends AsyncFunction> = (
  resultOf: AsyncReturnType<ExecFn>,
) => never | void;
