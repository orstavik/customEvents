const events = {};
window.customEvents ??= {};
customEvents.define = function (prefix, Class) {
  const overlapDefinition = Object.keys(events).find(old => prefix.startsWith(old) || old.startsWith(prefix));
  if (overlapDefinition)
    throw `The customEvent "${prefix}" is already defined as "${overlapDefinition}".`;
  if (Class.prefix)
    throw `${Class.name} definition is already used (${Class.name}.prefix === "${Class.prefix}"). 
    What about 'customEvents.define("${prefix}", class Something extends ${Class.name}{});'?`;
  Class.prefix = prefix;
  events[prefix] = Class;
};

function getDefinition(prefix) {
  for (let def in events)
    if (prefix.startsWith(def))
      return events[def];
}

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
    const Definition = getDefinition(type);
    if (Definition) {
      //only one customEventInstance with the same Definition is added to the same element.
      let {instance, list, meta} = customEventInstances.get(this, Definition) || {};
      if (!instance) {
        meta = getOrMakeMeta(Definition.prefix, this);
        const suffix = type.substring(Definition.prefix.length);
        instance = new Definition(meta, suffix), list = [];
        const {state, value} = meta.getState() || Definition.defaultState();
        instance.enterState(state, value);
        customEventInstances.set(this, Definition, {instance, list, meta});
      }
      //todo instance.listenCallback(type); //no longer sure how this plays out.
      list.push({type: Definition.prefix, cb, args});
    }
    OG.call(this, type, cb, ...args);
  }
}

function monkeypatchCustomEventsRemove(OG) {
  return function removeEventListener_customEvents(type, cb, ...args) {
    const Definition = getDefinition(type);
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