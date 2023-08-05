export type TypedRecord<TEnum extends string | number | symbol, TValue = any> = {
  [key in TEnum]?: TValue;
};

export type PropType<TObj, TProp extends keyof TObj> = TObj[TProp];

export type ArrayElementType<TArray> = TArray extends (infer T)[] ? T : never;
