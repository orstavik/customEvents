class StrOMap {
  get(Str, o1) {
    return this[Str]?.get(o1);
  }

  set(Str, o1, v) {
    const one = this[Str] || (this[Str] = new WeakMap());
    one.set(o1, v);
  }
}

//todo the problem here is wording conflicts. How do we avoid naming conflicts here without having a whole lot of back and forth.
const filters = {
  "prevented": e => e.defaultPrevented || e.defaultAction,//todo this isn't prevented, this is "default action unavailable".
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
customEvents.defineFilter = function (prefix, Function) {
  const overlapDefinition = Object.keys(filters).find(old => prefix.startsWith(old) || old.startsWith(prefix));
  if (overlapDefinition)
    throw `The eventFilter "${prefix}" is already defined as "${overlapDefinition}".`;
  filters[prefix] = Function;
};

const filteredCallbacks = new StrOMap();

export function monkeypatchFilteredEvents_add(OG) {
  return function addEventListener_filtered(type, cb, ...args) {
    const [name, ...filter] = type.split("-");
    if (!filter.length)
      return OG.call(this, type, cb, ...args);
    const filterKey = filter.join("-");
    let wrapped = filteredCallbacks.get(filterKey, cb);
    if (!wrapped) {
      wrapped = function eventListenerFilter(e) {
        for (let f of filter)
          if (f in filters && !filters[f](e))              //todo throw an Error if there is no such filter.
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
    const [name, ...filter] = type.split("-");
    if (!filter.length)
      return OG.call(this, type, cb, ...args);
    const filterKey = filter.join("-");
    let wrapped = filteredCallbacks.get(filterKey, cb);
    if (!wrapped)
      return OG.call(this, type, cb, ...args);
    OG.call(this, name, wrapped, ...args);
  }
}