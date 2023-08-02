import { z } from 'zod';
import { zap } from '../src/zap';
import { createMockFormDataClass } from './+helpers';
import * as fc from 'fast-check';

const keyArbitrary = fc
  .string({
    minLength: 1,
    maxLength: 10,
  })
  .filter(
    (x) =>
      x !== '__proto__' &&
      x !== 'constructor' &&
      x.indexOf('.') < 0 &&
      x.indexOf('[') < 0 &&
      x.indexOf(']') < 0
  );

const isNegativeZero = (x: number) => x === 0 && 1 / x === -Infinity;
const numberArbitrary = fc
  .float({
    noNaN: true,
    noDefaultInfinity: true,
  })
  .filter((x) => !isNegativeZero(x));

describe('test', () => {
  beforeEach(() => {
    globalThis.FormData = createMockFormDataClass();
  });

  it('works with a string property', async () => {
    await fc.assert(
      fc.asyncProperty(keyArbitrary, fc.string(), async (key, value) => {
        const schema = z.object({
          [key]: z.string(),
        });

        const data = new FormData();
        data.append(key, value);

        const valid = jest.fn();
        const invalid = jest.fn();
        const zapper = zap(schema).valid(valid).invalid(invalid);

        await zapper(data);

        expect(invalid).not.toHaveBeenCalled();
        expect(valid).toHaveBeenCalledWith({ [key]: value });
      })
    );
  });

  it('works with a number property', async () => {
    await fc.assert(
      fc.asyncProperty(keyArbitrary, numberArbitrary, async (key, value) => {
        const schema = z.object({
          [key]: z.number(),
        });

        const data = new FormData();
        data.append(key, value.toString());

        const valid = jest.fn();
        const invalid = jest.fn();
        const zapper = zap(schema).valid(valid).invalid(invalid);

        await zapper(data);
        expect(invalid).not.toHaveBeenCalled();
        expect(valid).toHaveBeenCalledWith({ [key]: value });
      })
    );
  });

  it('works with a boolean property', async () => {
    await fc.assert(
      fc.asyncProperty(keyArbitrary, fc.boolean(), async (key, value) => {
        const schema = z.object({
          [key]: z.boolean(),
        });

        const data = new FormData();
        data.append(key, value.toString());

        const valid = jest.fn();
        const invalid = jest.fn();

        const zapper = zap(schema).valid(valid).invalid(invalid);

        await zapper(data);

        expect(valid).toHaveBeenCalledWith({ [key]: value });
        expect(invalid).not.toHaveBeenCalled();
      })
    );
  });

  it('works with a property of the type array of strings', async () => {
    await fc.assert(
      fc.asyncProperty(
        keyArbitrary,
        fc.array(fc.string()),
        async (key, value) => {
          const schema = z.object({
            [key]: z.array(z.string()),
          });

          const data = new FormData();
          value.forEach((v) => data.append(key, v));

          const valid = jest.fn();
          const invalid = jest.fn();

          const zapper = zap(schema).valid(valid).invalid(invalid);

          await zapper(data);

          expect(valid).toHaveBeenCalledWith({ [key]: value });
          expect(invalid).not.toHaveBeenCalled();
        }
      )
    );
  });

  it('works with a property of the type array of numbers', async () => {
    await fc.assert(
      fc.asyncProperty(
        keyArbitrary,
        fc.array(numberArbitrary),
        async (key, value) => {
          const schema = z.object({
            [key]: z.array(z.number()),
          });

          const data = new FormData();
          value.forEach((v) => data.append(key, v.toString()));

          const valid = jest.fn();
          const invalid = jest.fn();

          const zapper = zap(schema).valid(valid).invalid(invalid);

          await zapper(data);

          expect(valid).toHaveBeenCalledWith({ [key]: value });
          expect(invalid).not.toHaveBeenCalled();
        }
      )
    );
  });

  it('works with a property of the type array of boolean', async () => {
    await fc.assert(
      fc.asyncProperty(
        keyArbitrary,
        fc.array(fc.boolean()),
        async (key, value) => {
          const schema = z.object({
            [key]: z.array(z.boolean()),
          });

          const data = new FormData();
          value.forEach((v) => data.append(key, v.toString()));

          const valid = jest.fn();
          const invalid = jest.fn();

          const zapper = zap(schema).valid(valid).invalid(invalid);

          await zapper(data);

          expect(valid).toHaveBeenCalledWith({ [key]: value });
          expect(invalid).not.toHaveBeenCalled();
        }
      )
    );
  });

  it('works with a property of the type object', async () => {
    await fc.assert(
      fc.asyncProperty(
        keyArbitrary,
        fc.dictionary(
          keyArbitrary,
          fc.oneof(fc.string(), fc.float(), fc.boolean())
        ),
        async (key, value) => {
          const schema = z.object({
            [key]: z.object({
              ...Object.fromEntries(
                Object.entries(value).map(([k, v]) => [
                  k,
                  typeof v === 'string'
                    ? z.string()
                    : typeof v === 'number'
                    ? z.number()
                    : z.boolean(),
                ])
              ),
            }),
          });

          const data = new FormData();
          Object.entries(value).forEach(([k, v]) =>
            data.append(`${key}.${k}`, v.toString())
          );

          const valid = jest.fn();
          const invalid = jest.fn();

          const zapper = zap(schema).valid(valid).invalid(invalid);

          await zapper(data);

          expect(valid).toHaveBeenCalledWith({ [key]: value });
          expect(invalid).not.toHaveBeenCalled();
        }
      )
    );
  });

  it('works with a property of the type array of objects that uses key based indexing', async () => {
    await fc.assert(
      fc.asyncProperty(
        keyArbitrary,
        fc.array(
          fc.tuple(
            keyArbitrary,
            fc.tuple(fc.string(), numberArbitrary, fc.boolean())
          )
        ),
        async (key, data) => {
          const schema = z.object({
            [key]: z.array(
              z.object({
                one: z.string(),
                two: z.number(),
                three: z.boolean(),
              })
            ),
          });

          const formData = new FormData();
          data.forEach(([k, [one, two, three]]) => {
            formData.append(`${key}.key`, k);
            formData.append(`${key}[${k}].one`, one);
            formData.append(`${key}[${k}].two`, two.toString());
            formData.append(`${key}[${k}].three`, three.toString());
          });

          const valid = jest.fn();
          const invalid = jest.fn();

          const zapper = zap(schema).valid(valid).invalid(invalid);

          zapper(formData);

          expect(valid).toHaveBeenCalledWith({
            [key]: data.map(([, [one, two, three]]) => ({
              one,
              two,
              three,
            })),
          });
          expect(invalid).not.toHaveBeenCalled();
        }
      )
    );
  });

  it('works with a property of the type array of objects that uses index based indexing', async () => {
    await fc.assert(
      fc.asyncProperty(
        keyArbitrary,
        fc.array(fc.tuple(fc.string(), numberArbitrary, fc.boolean())),
        async (key, data) => {
          const schema = z.object({
            [key]: z.array(
              z.object({
                one: z.string(),
                two: z.number(),
                three: z.boolean(),
              })
            ),
          });

          const formData = new FormData();
          data.forEach(([one, two, three], index) => {
            formData.append(`${key}[${index}].one`, one);
            formData.append(`${key}[${index}].two`, two.toString());
            formData.append(`${key}[${index}].three`, three.toString());
          });

          const valid = jest.fn();
          const invalid = jest.fn();

          const zapper = zap(schema).valid(valid).invalid(invalid);

          zapper(formData);

          expect(valid).toHaveBeenCalledWith({
            [key]: data.map(([one, two, three]) => ({
              one,
              two,
              three,
            })),
          });
          expect(invalid).not.toHaveBeenCalled();
        }
      )
    );
  });
});
