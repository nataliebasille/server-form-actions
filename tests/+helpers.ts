export class MockFormData {
  private _obj = new Map<string, string[]>();

  append(key: string, value: string) {
    if (this._obj.has(key)) {
      this._obj.get(key)!.push(value);
    } else {
      this._obj.set(key, [value]);
    }
  }

  has(key: string) {
    return this._obj.has(key);
  }

  get(key: string) {
    return this._obj.get(key)?.[0];
  }

  getAll(key: string) {
    return this._obj.get(key) ?? [];
  }

  entries() {
    return this._obj.entries();
  }
}

export const createMockFormDataClass = (): new () => FormData => {
  return MockFormData as any;
};
