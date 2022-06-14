const events = {};

window.customEvents = {};
customEvents.define = function (str, Class) {
  if (str in events)
    throw str + " is already defined as a custom event.";
  events[str] = Class;
};

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

//EventType => el => cb => customEvent;
const customEventInstances = new StrOOMap();
//todo ABC. what i need is just the type+el => customEventInstance + [cb1, cb2, cb3]...
// when there are no more listeners, then call destructor and remove.

function monkeypatchCustomEventsAdd(OG) {
  return function addEventListener_customEvents(type, cb, ...args) {
    const Definition = events[type];
    if (Definition) {
      if (customEventInstances.has(type, this, cb))
        throw "what to do when one event is being activated by several cbs on the same element?"; //todo no see ABC
      customEventInstances.set(type, this, cb, new Definition(this));
    }
    OG.call(this, type, cb, ...args);
  }
}

function monkeypatchCustomEventsRemove(OG) {
  return function removeEventListener_customEvents(type, cb, ...args) {
    customEventInstances.remove(type, this, cb)?.destructor();
    OG.call(this, type, cb, ...args);
  }
}

//monkeypatch the add/removeEventListener
(function (EventTargetOG, addEventListenerOG, removeEventListenerOG) {
  EventTargetOG.prototype.addEventListener =
    monkeypatchCustomEventsAdd(addEventListenerOG);
  EventTargetOG.prototype.removeEventListener = 
    monkeypatchCustomEventsRemove(removeEventListenerOG);
})(EventTarget, addEventListener, removeEventListener);