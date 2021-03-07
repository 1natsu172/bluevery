type PFn<ArgsType extends unknown[], ReturnValue> = (
  ...args: ArgsType
) => Promise<ReturnValue>;

export function toThrowErrorIfRejected<ArgsType extends unknown[], ReturnValue>(
  pFn: PFn<ArgsType, ReturnValue>,
): PFn<ArgsType, ReturnValue> {
  return async function (...fnParams) {
    try {
      return await pFn(...fnParams);
    } catch (error) {
      throw new Error(error);
    }
  };
}
