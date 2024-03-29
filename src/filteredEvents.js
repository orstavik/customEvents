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
  "buttons": (e, suffix) => e.buttons === parseInt(suffix),
  "outofbounds": e => e.clientY < 0 || e.clientX < 0 || e.clientX > window.innerWidth || e.clientY > window.innerHeight
};

window.customEvents ??= {};
customEvents.defineFilter = function (prefix, Function) {
  const overlapDefinition = Object.keys(filters).find(old => prefix.startsWith(old) || old.startsWith(prefix));
  if (overlapDefinition)
    throw `The eventFilter "${prefix}" is already defined as "${overlapDefinition}".`;
  filters[prefix] = Function;
};

const boundFilters = {};

function getBoundFilter(f) {
  if (f in boundFilters)
    return boundFilters[f];
  if (f in filters)
    return boundFilters[f] = filters[f];
  const prefix = Object.keys(filters).find(pre => f.startsWith(pre));
  const suffix = f.substring(prefix.length);
  return boundFilters[f] = function (e) {
    return filters[prefix].call(this, e, suffix, prefix);
  }
}

const filteredCallbacks = new StrOMap();

function makeFilterCallback(filter, cb, filterkey) {
  const readyFilters = [];
  const filteredListener = function eventListenerFilter(e) {
    for (let i = readyFilters.length; i < filter.length; i++) {
      const filterFunc = getBoundFilter(filter[i]);
      if (!filterFunc)                               //step 1, check that all the filters are ready, if not, abort everything
        return;
      readyFilters[i] = filterFunc;
    }
    for (let filterFunc of readyFilters) {
      if(!filterFunc(e))                             //step 2, if one filterFunc returns falsy, then the event processing is cancelled
        return;
      cb.call(this, e);                              //step 3, all the filters are ok, then run the callback.
    }
  };
  filteredCallbacks.set(filterkey, cb, filteredListener);
  return filteredListener;
}

export function monkeypatchFilteredEvents_add(OG) {
  return function addEventListener_filtered(type, cb, ...args) {
    const [name, ...filter] = type.split("-");
    if (!filter.length)
      return OG.call(this, type, cb, ...args);
    const filterKey = filter.join("-");
    const wrapped = filteredCallbacks.get(filterKey, cb) || makeFilterCallback(filter, cb, filterKey);
    OG.call(this, name, wrapped, ...args);
  }
}

export function monkeypatchFilteredEvents_remove(OG) {
  return function removeEventListener_filtered(type, cb, ...args) {
    const [name, ...filter] = type.split("-");
    if (!filter.length)
      return OG.call(this, type, cb, ...args);
    const filterKey = filter.join("-");
    const wrapped = filteredCallbacks.get(filterKey, cb) || cb;
    OG.call(this, name, wrapped, ...args);
  }
}