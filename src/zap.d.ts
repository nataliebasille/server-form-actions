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
export function zap<TSchema extends z.ZodEffects<any, any, any> | z.ZodObject<any, z.UnknownKeysParam, z.ZodTypeAny, {
    [x: string]: any;
}, {
    [x: string]: any;
}>>(schema: TSchema): ZapResult<TSchema>;
export type ZodPrimitive = z.ZodString | z.ZodNumber | z.ZodBoolean | z.ZodDate | z.ZodBigInt | z.ZodUndefined | z.ZodNull;
/**
 * <TSchema>
 */
export type ZapServerAction<TSchema extends z.ZodEffects<any, any, any> | z.ZodObject<any, z.UnknownKeysParam, z.ZodTypeAny, {
    [x: string]: any;
}, {
    [x: string]: any;
}>> = (data: FormData | z.infer<TSchema>) => Promise<void>;
/**
 * <TSchema>
 */
export type ZapResult<TSchema extends z.ZodEffects<any, any, any> | z.ZodObject<any, z.UnknownKeysParam, z.ZodTypeAny, {
    [x: string]: any;
}, {
    [x: string]: any;
}>> = ZapServerAction<TSchema> & {
    valid: (fn: (data: z.infer<TSchema>) => Promise<void>) => ZapResult<TSchema>;
    invalid: (fn: (errors: z.ZodError) => Promise<void>) => ZapResult<TSchema>;
};
import { z } from 'zod';
//# sourceMappingURL=zap.d.ts.map