import {
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
  type ZodTypeAny,
} from 'zod';

import {
  isZodArray,
  isZodBigInt,
  isZodBoolean,
  isZodDate,
  isZodEffects,
  isZodNull,
  isZodNumber,
  isZodObject,
  isZodString,
  isZodUndefined,
} from './helpers';
import { type ZapFields, createZapFields } from './fields';

type ZodPrimitive =
  | ZodString
  | ZodNumber
  | ZodBoolean
  | ZodDate
  | ZodBigInt
  | ZodUndefined
  | ZodNull;

type ZapError = {
  [key: string]: string;
};

export type ZapResult<TSchema extends ZodObject<any> | ZodEffects<any>> =
  | {
      type: 'valid';
      data: Infer<TSchema>;
    }
  | {
      type: 'invalid';
      errors: ZapError;
    };

export type ZapServerAction<TSchema extends ZodObject<any> | ZodEffects<any>> =
  ((data: FormData | Infer<TSchema>) => Promise<ZapResult<Infer<TSchema>>>) & {
    fields: ZapFields<Infer<TSchema>>;
  };

export function zap<TSchema extends ZodObject<any> | ZodEffects<any>>(
  schema: TSchema
): ZapServerAction<TSchema> {
  const action = async (
    data: FormData | Infer<TSchema>
  ): Promise<ZapResult<TSchema>> => {
    data = data instanceof FormData ? formDataToObject(data, schema) : data;

    const result = schema.safeParse(data);

    if (result.success) {
      return { type: 'valid', data: result.data };
    }

    const formErrors = (result as SafeParseError<any>).error.errors.reduce(
      (acc, error) => {
        const { path, message } = error;
        const key = path.join('.');

        return { ...acc, [key]: message };
      },
      {}
    );

    return { type: 'invalid', errors: formErrors };
  };

  action.fields = createZapFields<TSchema>(schema);

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

    if (isZodArray(propertySchema)) {
      const { element: elementSchema } = propertySchema;

      if (isPrimitive(elementSchema)) {
        obj[property] = formData
          .getAll(name)
          .map((value) => transformPrimitive(value, elementSchema));
      } else if (isZodObject(elementSchema)) {
        obj[property] = indexBased_formDataForArrayOfObjects(
          formData,
          elementSchema,
          name
        );
      }
    } else if (isZodObject(propertySchema)) {
      obj[property] = formDataToObject(formData, propertySchema, name);
    } else {
      obj[property] = transformPrimitive(formData.get(name), propertySchema);
    }
  }

  return obj;
}

function getSchemaShape(schema: ZodObject<any> | ZodEffects<any>): {
  [key: string]: ZodTypeAny;
} {
  if (isZodEffects(schema)) {
    return getSchemaShape(schema._def.schema);
  }

  return schema.shape;
}

function transformPrimitive(value: FormDataEntryValue, schema: ZodType) {
  const valueType = typeof value;
  if (value !== null && valueType === 'object') {
    throw new Error(
      `Form value types of non strings are not yet supported. Sorry :(`
    );
  }

  return isZodNumber(schema)
    ? Number(value)
    : isZodBoolean(schema)
    ? value === 'true'
    : isZodDate(schema)
    ? new Date(value as string)
    : isZodBigInt(schema)
    ? BigInt(value as string)
    : isZodUndefined(schema) && (value === 'undefined' || value === '')
    ? undefined
    : isZodNull(schema) && (value === null || value === '')
    ? null
    : value;
}

function isPrimitive(schema: ZodType): schema is ZodPrimitive {
  return (
    isZodString(schema) ||
    isZodNumber(schema) ||
    isZodBoolean(schema) ||
    isZodDate(schema) ||
    isZodBigInt(schema) ||
    isZodUndefined(schema) ||
    isZodNull(schema)
  );
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
      formData.has(`${name}.${index}.${property}`)
    )
  ) {
    obj.push(formDataToObject(formData, elementSchema, `${name}.${index}`));
    index++;
  }

  return obj;
}
