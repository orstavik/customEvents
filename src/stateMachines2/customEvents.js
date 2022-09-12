const events = {};
const definedEventControllers = new WeakMap();
window.customEvents ??= {};
customEvents.define = function (str, Class) {
  if (str in events)
    throw str + " is already defined as a custom event.";
  if (definedEventControllers.has(Class))
    throw `${Class.name} is already defined as "${definedEventControllers.get(Class)}". 
    What about 'customEvents.define("${str}", class Something extends ${Class.name}{});'?`;
  definedEventControllers.set(Class, str);
  Class.prefix = str;
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
    return super.get(o1)?.delete(o2);
  }
}

//EventType => el => cb => customEvent;
const customEventInstances = new OOWeakMap();
//todo ABC. what i need is just the type+el => customEventInstance + [cb1, cb2, cb3]...
// when there are no more listeners, then call destructor and remove.

import {getOrMakeMeta} from "./HTMLMetaElement_target.js";

function monkeypatchCustomEventsAdd(OG) {
  return function addEventListener_customEvents(type, cb, ...args) {
    const Definition = events[type];                   //todo look for prefix, not for exact match.
    if (Definition) {
      //only one customEventInstance with the same Definition is added to the same element.
      let {instance, list, meta} = customEventInstances.get(this, Definition) || {};
      if (!instance) {
        meta = getOrMakeMeta(type, this);
        instance = new Definition(meta), list = [];
        const {state, value} = meta.getState() || Definition.defaultState();
        instance.enterState(state, value);
        customEventInstances.set(this, Definition, {instance, list, meta});
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
      let {instance, list, meta} = customEventInstances.get(this, Definition); //one customEventInstance per target element
      for (let i = 0; i < list.length; i++) {
        let {type: type2, cb: cb2, args} = list[i];
        if (type2 === type && cb2 === cb) {
          list.splice(i, 1);
          break;
        }
      }
      if (list.length === 0) {
        instance.destructor();
        meta.remove();
        customEventInstances.remove(this, Definition);
      }
    }
    OG.call(this, type, cb, ...args);
  }
}

import {monkeypatchFilteredEvents_add, monkeypatchFilteredEvents_remove} from "../filteredEvents.js";
import {monkeyDefaultAction} from "../Event.defaultAction.js";
//monkeypatch the add/removeEventListener
(function (EventTargetOG, addEventListenerOG, removeEventListenerOG) {
  EventTargetOG.prototype.addEventListener = monkeypatchFilteredEvents_add(monkeypatchCustomEventsAdd(addEventListenerOG));
  EventTargetOG.prototype.removeEventListener = monkeypatchFilteredEvents_remove(monkeypatchCustomEventsRemove(removeEventListenerOG));
})(EventTarget, addEventListener, removeEventListener);

monkeyDefaultAction(Event);