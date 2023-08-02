import { z } from 'zod';

/**
 * @typedef { z.ZodString | z.ZodNumber | z.ZodBoolean | z.ZodDate | z.ZodBigInt | z.ZodUndefined | z.ZodNull} ZodPrimitive
 */

/**
 * @template {z.ZodObject | z.ZodEffects} TSchema
 * @typedef { (data: FormData | z.infer<TSchema>) => Promise<void> } ZapServerAction<TSchema>
 */

/**
 * @template {z.ZodObject | z.ZodEffects} TSchema
 * @typedef { ZapServerAction<TSchema> & { valid: (fn: (data: z.infer<TSchema>) => Promise<void>) => ZapResult<TSchema>, invalid: (fn: (errors: z.ZodError) => Promise<void>) => ZapResult<TSchema> } } ZapResult<TSchema>
 */

/**
 * @template {z.ZodObject | z.ZodEffects} TSchema
 * @param {TSchema} schema
 * @returns {ZapResult<TSchema>}
 */
export function zap(schema) {
  let valid = undefined;
  let invalid = undefined;
  const action = async (data) => {
    data  = data instanceof FormData
    ? formDataToObject(data, schema)
    : data;

    const result = schema.safeParse(data);

    return await (result.success ? valid?.(result.data) : invalid?.(result.error));
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

/**
 * @param {FormData} formData
 * @param {z.ZodObject | z.ZodEffects} schema
 * @returns {*}
 */
function formDataToObject(formData, schema, namePrefix = '') {
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

/**
 *
 * @param {z.ZodObject | z.ZodEffects} schema
 * @returns {{ [key: string]: z.ZodTypeAny } }}
 */
function getSchemaShape(schema) {
  if (schema instanceof z.ZodEffects) {
    return getSchemaShape(schema._def.schema);
  }
  return schema.shape;
}

/**
 *
 * @param {string} value
 * @param {z.ZodType} schema
 * @returns
 */
function transformPrimitive(value, schema) {
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

/**
 *
 * @param {z.ZodType} schema
 * @returns {schema is ZodPrimitive}
 */
function isPrimitive(schema) {
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

/**
 *
 * @param {FormData} formData
 * @param {z.ZodObject} elementSchema
 * @param {string} name
 */
function keyBased_formDataForArrayOfObjects(formData, elementSchema, name) {
  const keys = formData.getAll(`${name}.key`);
  const obj = [];
  for (const key of keys) {
    obj.push(formDataToObject(formData, elementSchema, `${name}[${key}]`));
  }

  return obj;
}

/**
 *
 * @param {FormData} formData
 * @param {z.ZodObject} elementSchema
 * @param {string} name
 */
function indexBased_formDataForArrayOfObjects(formData, elementSchema, name) {
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
