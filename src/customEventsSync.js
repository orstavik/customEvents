//mutate the target, currentTarget, path, composedPath of an Event object.
function rewind(event, currentTarget, target, path, composedPath) {
  Object.defineProperties(event, {
    "currentTarget": {value: currentTarget},
    "target": {value: target},
    "path": {value: path},
    "composedPath": {value: composedPath}
  });
}

function nextTick(cb){
  const audio = document.createElement("audio");
  audio.onratechange = cb;
  audio.playbackRate = 2;
}

function monkeyDefaultAction(Event) {
  const defaultActions = new WeakMap();
  Object.defineProperty(Event.prototype, "defaultAction", {
    get() {
      return !!defaultActions.get(this);
    },
    set(v) {
      if (!(v instanceof Function))
        throw "defaultActions must be a callable function";
      if (defaultActions.has(this))
        return;
      defaultActions.set(this, v);
      const current = this.currentTarget;
      const target = this.target;
      const path = this.path;              //path and composedPath will work with closed and open shadowDoms,
      const composed = this.composedPath();//as they are read at the same position as the callback.
      nextTick(_ => this.defaultPrevented || rewind(this, current, target, path, () => composed) || v(this));
    }
  });
}

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
  "currentTarget": e => e.target === e.currentTarget,
  "hostTarget": e => e.eventPhase === Event.AT_TARGET,
  "childTarget": e => e.target.parentNode === e.currentTarget
};

const filteredCallbacks = new StrOMap();

function monkeypatchFilteredEvents_add(OG) {
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

function monkeypatchFilteredEvents_remove(OG) {
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

const events = {};

window.customEvents = {};
customEvents.define = function (str, Class) {
  if (str in events)
    throw str + " is already defined as a custom event.";
  events[str] = Class;
};

//obj+obj => obj weakmap
class OOWeakMap extends WeakMap {
  get(o1, o2) {
    return super.get(o1)?.get(o2);
  }

  set(o1, o2, v) {
    let one = super.get(o1);
    one || super.set(o1, one = new WeakMap());
    one.set(o2, v);
  }

  remove(o1, o2) {
    return super.get(o1)?.remove(o2);
  }
}

//EventType => el => cb => customEvent;
const customEventInstances = new OOWeakMap();
//todo ABC. what i need is just the type+el => customEventInstance + [cb1, cb2, cb3]...
// when there are no more listeners, then call destructor and remove.

function monkeypatchCustomEventsAdd(OG) {
  return function addEventListener_customEvents(type, cb, ...args) {
    const Definition = events[type];
    if (Definition) {
      //only one customEventInstance with the same Definition is added to the same element.
      let {instance, list} = customEventInstances.get(this, Definition) || {};
      if (!instance) {
        instance = new Definition(this), list = [];
        customEventInstances.set(this, Definition, {instance, list});
      }
      list.push({type, cb, args});
    }
    OG.call(this, type, cb, ...args);
  }
}

function monkeypatchCustomEventsRemove(OG) {
  return function removeEventListener_customEvents(type, cb, ...args) {
    const Definition = events[type];
    if (Definition) {
      let {instance, list} = customEventInstances.get(this, Definition); //only one customEventInstance with the same Definition is added to the same element.
      for (let i = 0; i < list.length; i++) {
        let {type2, cb2, args} = list[i];
        if (type2 === type && cb2 === cb) {
          list.splice(i, 1);
          break;
        }
      }
      if (list.length === 0) {
        instance.destructor();
        customEventInstances.remove(this, Definition);
      }
    }
    customEventInstances.remove(type, this, cb)?.destructor();
    OG.call(this, type, cb, ...args);
  }
}

//monkeypatch the add/removeEventListener
(function (EventTargetOG, addEventListenerOG, removeEventListenerOG) {
  EventTargetOG.prototype.addEventListener = monkeypatchFilteredEvents_add(monkeypatchCustomEventsAdd(addEventListenerOG));
  EventTargetOG.prototype.removeEventListener = monkeypatchFilteredEvents_remove(monkeypatchCustomEventsRemove(removeEventListenerOG));
})(EventTarget, addEventListener, removeEventListener);

monkeyDefaultAction(Event);