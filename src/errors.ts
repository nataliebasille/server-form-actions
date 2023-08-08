import { type ZodEffects, type ZodObject, type infer as Infer } from 'zod';
import { type NestedKeyOf } from './helpers';

type ErrorsFromShape<TShape> = {
  [K in NestedKeyOf<TShape>]?: string;
};

export type ZapError<TSchema extends ZodObject<any> | ZodEffects<any>> =
  ErrorsFromShape<Infer<TSchema>>;
