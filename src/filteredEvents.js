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
  "prevented": e=> e.defaultPrevented || e.defaultAction,
  "shift": e => e.shiftKey,
  "meta": e => e.metaKey,
  "alt": e => e.altKey,
  "ctrl": e => e.ctrlKey,
  "space": e => e.key = " ",
  "enter": e => e.key === "Enter",
  "tab": e => e.key === "tab",
  "currenttarget": e => e.target === e.currentTarget,
  "hosttarget": e => e.eventPhase === Event.AT_TARGET,
  "childtarget": e => e.target.parentNode === e.currentTarget,
  "1": e => e.buttons === 1,
  "outofbounds": e => e.clientY < 0 || e.clientX < 0 || e.clientX > window.innerWidth || e.clientY > window.innerHeight
};

window.customEvents ??= {};
customEvents.defineFilter = function(key, func){
  if(filters[key])
    throw key + " is already declared as an event filter.";
  filters[key] = func;
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