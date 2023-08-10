import {
  type ZodTypeAny,
  type infer as Infer,
  type ZodFirstPartySchemaTypes,
} from 'zod';
import { type NestedKeyOf } from './helpers';

export type ZapFields<TSchema extends ZodTypeAny> = <
  TName extends NestedKeyOf<Infer<TSchema>>
>(
  field: TName
) => TName;

export function createZapFields<TSchema extends ZodFirstPartySchemaTypes>(
  schema: TSchema
) {
  const fieldsFn: ZapFields<TSchema> = (field) => field;

  return fieldsFn;
}
