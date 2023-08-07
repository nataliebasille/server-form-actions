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
    expect(fields.name.valueOf()).toEqual('name');
    expect(fields.age.valueOf()).toEqual('age');
    expect(fields.isCool.valueOf()).toEqual('isCool');
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
    expect(fields.name.valueOf()).toEqual('name');
    expect(fields.age.valueOf()).toEqual('age');
    expect(fields.isCool.valueOf()).toEqual('isCool');
    expect(fields.address.valueOf()).toEqual('address');
    expect(fields.address.street.valueOf()).toEqual('address.street');
    expect(fields.address.city.valueOf()).toEqual('address.city');
    expect(fields.address.state.valueOf()).toEqual('address.state');
    expect(fields.address.zip.valueOf()).toEqual('address.zip');
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

    expect(fields.name.valueOf()).toEqual('name');
    expect(fields.age.valueOf()).toEqual('age');
    expect(fields.isCool.valueOf()).toEqual('isCool');
    expect(fields.address[0].valueOf()).toEqual('address.0');
    expect(fields.address[1].valueOf()).toEqual('address.1');
    expect(fields.address[2].valueOf()).toEqual('address.2');

    expect(fields.address[0].street.valueOf()).toEqual('address.0.street');
    expect(fields.address[1].city.valueOf()).toEqual('address.1.city');
    expect(fields.address[2].state.valueOf()).toEqual('address.2.state');
    expect(fields.address[3].zip.valueOf()).toEqual('address.3.zip');
  });
});
