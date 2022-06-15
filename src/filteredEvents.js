class StrOMap {
  get(Str, o1) {
    return this[Str]?.get(o1);
  }

  set(Str, o1, v) {
    const one = this[Str] || (this[Str] = new WeakMap());
    one.set(o1, v);
  }
}

const filters = {
  "shift": e => e.shiftKey,
  "meta": e => e.metaKey,
  "alt": e => e.altKey,
  "ctrl": e => e.ctrlKey,
  "space": e => e.key = " ",
  "enter": e => e.key === "Enter",
  "tab": e => e.key === "tab",
};

const filteredCallbacks = new StrOMap();

export function monkeypatchFilteredEvents_add(OG) {
  return function addEventListener_filtered(type, cb, ...args) {
    const [name, ...filter] = type.split("_");
    if (!filter.length)
      return OG.call(this, type, cb, ...args);
    const filterKey = filter.join("_");
    let wrapped = filteredCallbacks.get(filterKey, cb);
    if (!wrapped) {
      wrapped = function eventListenerFilter(e) {
        for (let f of filter)
          if (f in filters && !filters[f](e))
            return;
        cb.call(this, e);
      };
      filteredCallbacks.set(filterKey, cb, wrapped);
    }
    OG.call(this, name, wrapped, ...args);
  }
}

export function monkeypatchFilteredEvents_remove(OG) {
  return function removeEventListener_filtered(type, cb, ...args) {
    const [name, ...filter] = type.split("_");
    if (!filter.length)
      return OG.call(this, type, cb, ...args);
    const filterKey = filter.join("_");
    let wrapped = filteredCallbacks.get(filterKey, cb);
    if (!wrapped)
      return OG.call(this, type, cb, ...args);
    OG.call(this, name, wrapped, ...args);
  }
}