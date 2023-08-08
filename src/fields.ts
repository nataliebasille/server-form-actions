import {
  type ZodTypeAny,
  type infer as Infer,
  type ZodFirstPartySchemaTypes,
} from 'zod';
import {
  type IsTuple,
  type TupleIndices,
  getSchemaShape,
  isZodArray,
  isZodEffects,
  isZodObject,
} from './helpers';

type FieldsFromShape<
  TShape,
  BaseName extends string = '',
  Prefix extends string = BaseName extends '' ? '' : `${BaseName}.`
> = IsTuple<TShape> extends true
  ? {
      [K in TupleIndices<
        TShape extends readonly any[] ? TShape : never
      >]: FieldsFromShape<
        TShape extends readonly (infer ElementType)[] ? ElementType : never,
        `${Prefix}${K}`
      >;
    }
  : TShape extends Array<infer ElementType>
  ? FieldsFromShape<ElementType, `${Prefix}${number}`>[] & BaseName
  : TShape extends object
  ? {
      [K in keyof TShape & (string | number)]: FieldsFromShape<
        TShape[K],
        `${Prefix}${K}`
      >;
    } & BaseName
  : BaseName;

export type ZapFields<TSchema extends ZodTypeAny> = FieldsFromShape<
  Infer<TSchema>
>;

export function createZapFields<TSchema extends ZodFirstPartySchemaTypes>(
  schema: TSchema
) {
  return createZapFieldsProxy(schema) as unknown as ZapFields<Infer<TSchema>>;
}

function createZapFieldsProxy<
  TSchema extends ZodTypeAny,
  TParent extends string = ''
>(schema: TSchema, parentField: TParent = '' as TParent) {
  const prefix = parentField ? `${parentField}.` : '';

  const isArray = isZodArray(schema);
  const shouldProxy = isZodEffects(schema) || isZodObject(schema) || isArray;

  if (shouldProxy) {
    const target = isArray ? [] : getSchemaShape(schema);
    return new Proxy(target, {
      get(target, key) {
        if (key === 'valueOf' || key === 'toString') {
          return () => parentField;
        }

        if (checkKeyInTarget(target, key)) {
          const childSchema = isArray ? schema.element : target[key];
          return createZapFieldsProxy(childSchema, `${prefix}${key}`);
        }

        return parentField[key];
      },
    });
  }

  return parentField;
}

function checkKeyInTarget(target: any, key: string | symbol): key is string {
  return target instanceof Array
    ? keyInArrayTarget(target, key)
    : typeof target === 'object'
    ? keyInObjectTarget(target, key)
    : false;
}

function keyInObjectTarget(target: any, key: string | symbol) {
  return typeof key === 'string' && key in target;
}

function keyInArrayTarget(_: any, key: string | symbol) {
  return (
    typeof key === 'string' &&
    // strings are valid as left hand side of bitwise operator
    // but typescript doesn't think so.
    (key as unknown as number) >>> 0 === parseFloat(key)
  );
}
