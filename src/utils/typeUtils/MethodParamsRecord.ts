// make record type that Method Parameters of T
export type MethodParamsRecord<T> = {
  [P in keyof T]: T[P] extends (...args: infer Args) => any ? Args : never;
};
