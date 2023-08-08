import type {
  ZodArray,
  ZodBigInt,
  ZodBoolean,
  ZodDate,
  ZodEffects,
  ZodNull,
  ZodNumber,
  ZodObject,
  ZodString,
  ZodType,
  ZodTypeAny,
  ZodUndefined,
} from 'zod';

export type TupleIndices<T extends readonly any[]> = Extract<
  keyof T,
  `${number}`
> extends `${infer N extends number}`
  ? N
  : never;

export type IsTuple<T> = T extends [any, ...any] ? true : false;

export type NestedKeyOf<T> = IsTuple<T> extends true
  ? {
      [Key in TupleIndices<T extends readonly any[] ? T : never>]:
        | `${Key}`
        | `${Key}.${NestedKeyOf<
            T extends readonly (infer ElementType)[] ? ElementType : never
          >}`;
    }[TupleIndices<T extends readonly any[] ? T : never>]
  : T extends Array<infer ElementType>
  ? `${number}` | `${number}.${NestedKeyOf<ElementType>}`
  : T extends object
  ? {
      [Key in keyof T & (string | number)]: T[Key] extends object
        ? `${Key}` | `${Key}.${NestedKeyOf<T[Key]>}`
        : `${Key}`;
    }[keyof T & (string | number)]
  : never;

export function getSchemaShape(schema: ZodObject<any> | ZodEffects<any>): {
  [key: string]: ZodTypeAny;
} {
  if (isZodEffects(schema)) {
    return getSchemaShape(schema._def.schema);
  }

  return schema.shape;
}

export function isZodObject(schema: ZodType): schema is ZodObject<any> {
  return schema.constructor.name === 'ZodObject';
}

export function isZodEffects(schema: ZodType): schema is ZodEffects<any> {
  return schema.constructor.name === 'ZodEffects';
}

export function isZodArray(schema: ZodType): schema is ZodArray<any> {
  return schema.constructor.name === 'ZodArray';
}

export function isZodString(schema: ZodType): schema is ZodString {
  return schema.constructor.name === 'ZodString';
}

export function isZodNumber(schema: ZodType): schema is ZodNumber {
  return schema.constructor.name === 'ZodNumber';
}

export function isZodBoolean(schema: ZodType): schema is ZodBoolean {
  return schema.constructor.name === 'ZodBoolean';
}

export function isZodDate(schema: ZodType): schema is ZodDate {
  return schema.constructor.name === 'ZodDate';
}

export function isZodBigInt(schema: ZodType): schema is ZodBigInt {
  return schema.constructor.name === 'ZodBigInt';
}

export function isZodUndefined(schema: ZodType): schema is ZodUndefined {
  return schema.constructor.name === 'ZodUndefined';
}

export function isZodNull(schema: ZodType): schema is ZodNull {
  return schema.constructor.name === 'ZodNull';
}
