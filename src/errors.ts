import { type ZodEffects, type ZodObject, type infer as Infer } from 'zod';
import { type NestedKeyOf } from './helpers';

export type ZapError<TSchema extends ZodObject<any> | ZodEffects<any>> = (
  field: NestedKeyOf<Infer<TSchema>>
) => string | undefined;
