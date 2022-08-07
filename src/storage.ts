export default function(ns: string, storage: Storage = new MemoryStorage()) {
  return {
    get: (key: string) => localStorage.getItem(nsKey(ns, key)),
    set: (key: string, value: string) => localStorage.setItem(nsKey(ns, key), value),
    remove: (key: string) => localStorage.removeItem(nsKey(ns, key)),
  };
}

const nsKey = (ns: string, key: string) => `${ns}_${key}`;

class MemoryStorage {
  constructor() {}

  get length() { return 0 }

  clear() {}

  key(index: number) { return '' }

  getItem(key: string) { return '' }

  setItem(key: string, value: string) {}

  removeItem(key: string) {}
}
