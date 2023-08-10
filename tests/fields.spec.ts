import * as z from 'zod';
import { createZapFields } from '../src/fields';

describe('zap fields', () => {
  it('gets field names for top level properties', () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
      isCool: z.boolean(),
    });
    const fields = createZapFields(schema);
    expect(fields('name')).toEqual('name');
    expect(fields('age')).toEqual('age');
    expect(fields('isCool')).toEqual('isCool');
  });

  it('gets field names for nested properties', () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
      isCool: z.boolean(),
      address: z.object({
        street: z.string(),
        city: z.string(),
        state: z.string(),
        zip: z.string(),
      }),
    });
    const fields = createZapFields(schema);
    expect(fields('name')).toEqual('name');
    expect(fields('age')).toEqual('age');
    expect(fields('isCool')).toEqual('isCool');
    expect(fields('address')).toEqual('address');
    expect(fields('address.street')).toEqual('address.street');
    expect(fields('address.city')).toEqual('address.city');
    expect(fields('address.state')).toEqual('address.state');
    expect(fields('address.zip')).toEqual('address.zip');
  });

  it('gets field names for array properties', () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
      isCool: z.boolean(),
      address: z.array(
        z.object({
          street: z.string(),
          city: z.string(),
          state: z.string(),
          zip: z.string(),
        })
      ),
    });

    const fields = createZapFields(schema);
    expect(fields('name')).toEqual('name');
    expect(fields('age')).toEqual('age');
    expect(fields('isCool')).toEqual('isCool');
    expect(fields('address.0')).toEqual('address.0');
    expect(fields('address.1')).toEqual('address.1');
    expect(fields('address.2')).toEqual('address.2');

    expect(fields('address.0.street')).toEqual('address.0.street');
    expect(fields('address.1.city')).toEqual('address.1.city');
    expect(fields('address.2.state')).toEqual('address.2.state');
    expect(fields('address.3.zip')).toEqual('address.3.zip');
  });
});
