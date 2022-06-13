const events = {};

window.customEvents = {};
customEvents.define = function (str, Class) {
  if (str in events)
    throw str + " is already defined as a custom event.";
  events[str] = Class;
};

//ev => el => cb => customEvent;
const customEventMap = new WeakMap();

function getCustomEventInstance(el, ev, cb) {
  return customEventMap[ev]?.get(el)?.get(cb);
}

function hasCustomEventInstance(el, ev, cb) {
  return !!getCustomEventInstance(el, ev, cb);
}

function setCustomEvent(el, ev, cb, customEvent) {
  const one = customElements[ev] || (customElements[ev] = new WeakMap());
  let two = one.get(el);
  !two && one.set(el, two = new WeakMap());
  two.set(cb, customEvent);
}


//monkeypatch the add/removeEventListener
(function (EventTargetOG, addEventListenerOG, removeEventListenerOG) {
  EventTargetOG.prototype.addEventListener = function addEventListener_customEvents(type, cb) {
    if (type in events) {
      if (hasCustomEventInstance(this, type, cb))
        throw "what to do when one event is being activated by several cbs on the same element?";
      const customEvent = new events[type](this);
      setCustomEvent(this, type, cb, customEvent);
    }
    addEventListenerOG.call(this, type, cb);
  }
})(EventTarget, addEventListener, removeEventListener);