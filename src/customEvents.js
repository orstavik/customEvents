//str=>obj=>obj => v map
//todo naive, it doesn't clean itself up perfectly. It can mushroom.
class StrOOMap {
  get(Str, o1, o2) {
    return this[Str]?.get(o1)?.get(o2);
  }

  has(Str, o1, o2) {
    return !!this.get(Str, o1, o2);
  }

  set(Str, o1, o2, v) {
    const one = this[Str] || (this[Str] = new WeakMap());
    let two = one.get(o1);
    !two && one.set(o1, two = new WeakMap());
    two.set(o2, v);
  }

  remove(Str, o1, o2) {
    return this[Str]?.get(o1)?.remove(o2);
  }
}

const events = {};

window.customEvents = {};
customEvents.define = function (str, Class) {
  if (str in events)
    throw str + " is already defined as a custom event.";
  events[str] = Class;
};

function getCustomEvent(name) {
  //todo here we can add the filter definitions.
  return events[name];
}

//EventType => el => cb => customEvent;
const customEventInstances = new StrOOMap();

//monkeypatch the add/removeEventListener
(function (EventTargetOG, addEventListenerOG, removeEventListenerOG) {
  EventTargetOG.prototype.addEventListener = function addEventListener_customEvents(type, cb) {
    const Definition = getCustomEvent(type);
    if (Definition) {
      if (customEventInstances.has(type, this, cb))
        throw "what to do when one event is being activated by several cbs on the same element?";
      customEventInstances.set(type, this, cb, new Definition(this));
    }
    addEventListenerOG.call(this, type, cb);
  };
  EventTargetOG.prototype.removeEventListener = function removeEventListener_customEvents(type, cb) {
    customEventInstances.remove(type, this, cb)?.destructor();
    removeEventListenerOG.call(this, type, cb);
  }
})(EventTarget, addEventListener, removeEventListener);