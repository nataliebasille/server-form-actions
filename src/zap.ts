import {
  z,
  type ZodObject,
  type ZodString,
  type ZodNumber,
  type ZodBoolean,
  type ZodDate,
  type ZodBigInt,
  type ZodUndefined,
  type ZodNull,
  type ZodEffects,
  type ZodType,
  type infer as Infer,
  type SafeParseError,
} from 'zod';

type ZodPrimitive =
  | ZodString
  | ZodNumber
  | ZodBoolean
  | ZodDate
  | ZodBigInt
  | ZodUndefined
  | ZodNull;

export type ZapServerAction<
  TSchema extends ZodObject<any> | ZodEffects<any>,
  TReturn = void
> = (data: FormData | Infer<TSchema>) => Promise<TReturn>;
type ZapResult<
  TSchema extends ZodObject<any> | ZodEffects<any>,
  TReturn = void
> = ZapServerAction<TSchema, TReturn> & {
  valid: <TNextReturn = void>(
    fn: (data: Infer<TSchema>) => Promise<TNextReturn>
  ) => ZapResult<TSchema, TNextReturn>;
  invalid: (
    fn: (errors: z.ZodError) => Promise<void>
  ) => ZapResult<TSchema, TReturn>;
};

export function zap<TSchema extends ZodObject<any> | ZodEffects<any>>(
  schema: TSchema
): ZapResult<TSchema, Infer<TSchema>> {
  let valid = undefined;
  let invalid = undefined;
  const action = async (data: FormData | Infer<TSchema>) => {
    data = data instanceof FormData ? formDataToObject(data, schema) : data;

    const result = schema.safeParse(data);

    return await (result.success
      ? valid?.(result.data)
      : invalid?.((result as SafeParseError<any>).error));
  };

  action.valid = (fn) => {
    valid = fn;
    return action;
  };

  action.invalid = (fn) => {
    invalid = fn;
    return action;
  };

  return action;
}

function formDataToObject(
  formData: FormData,
  schema: ZodObject<any> | ZodEffects<any>,
  namePrefix: string = ''
) {
  const shape = getSchemaShape(schema);
  const obj = {};
  for (const [property, propertySchema] of Object.entries(shape)) {
    const name = `${namePrefix ? `${namePrefix}.` : ''}${property}`;

    if (propertySchema instanceof z.ZodArray) {
      const { element: elementSchema } = propertySchema;

      if (isPrimitive(elementSchema)) {
        obj[property] = formData
          .getAll(name)
          .map((value) => transformPrimitive(value, elementSchema));
      } else if (elementSchema instanceof z.ZodObject) {
        const useKeyBasedStrategy = formData.has(`${name}.key`);
        obj[property] = (
          useKeyBasedStrategy
            ? keyBased_formDataForArrayOfObjects
            : indexBased_formDataForArrayOfObjects
        )(formData, elementSchema, name);
      }
    } else if (propertySchema instanceof z.ZodObject) {
      obj[property] = formDataToObject(formData, propertySchema, name);
    } else {
      obj[property] = transformPrimitive(formData.get(name), propertySchema);
    }
  }

  return obj;
}

function getSchemaShape(schema: ZodObject<any> | ZodEffects<any>): {
  [key: string]: z.ZodTypeAny;
} {
  if (schema instanceof z.ZodEffects) {
    return getSchemaShape(schema._def.schema);
  }

  return schema.shape;
}

function transformPrimitive(value: string | File, schema: ZodType) {
  if (value instanceof File) {
    throw new Error('File upload not supported yet');
  }

  return schema instanceof z.ZodNumber
    ? Number(value)
    : schema instanceof z.ZodBoolean
    ? value === 'true'
    : schema instanceof z.ZodDate
    ? new Date(value)
    : schema instanceof z.ZodBigInt
    ? BigInt(value)
    : schema instanceof z.ZodUndefined &&
      (value === 'undefined' || value === '')
    ? undefined
    : schema instanceof z.ZodNull && (value === null || value === '')
    ? null
    : value;
}

function isPrimitive(schema: ZodType): schema is ZodPrimitive {
  return (
    schema instanceof z.ZodString ||
    schema instanceof z.ZodNumber ||
    schema instanceof z.ZodBoolean ||
    schema instanceof z.ZodDate ||
    schema instanceof z.ZodBigInt ||
    schema instanceof z.ZodUndefined ||
    schema instanceof z.ZodNull
  );
}

function keyBased_formDataForArrayOfObjects(
  formData: FormData,
  elementSchema: ZodObject<any>,
  name: string
) {
  const keys = formData.getAll(`${name}.key`);
  const obj = [];
  for (const key of keys) {
    obj.push(formDataToObject(formData, elementSchema, `${name}[${key}]`));
  }

  return obj;
}

function indexBased_formDataForArrayOfObjects(
  formData: FormData,
  elementSchema: ZodObject<any>,
  name: string
) {
  const obj = [];
  const shape = getSchemaShape(elementSchema);
  let index = 0;
  while (
    Object.keys(shape).some((property) =>
      formData.has(`${name}[${index}].${property}`)
    )
  ) {
    obj.push(formDataToObject(formData, elementSchema, `${name}[${index}]`));
    index++;
  }

  return obj;
}
