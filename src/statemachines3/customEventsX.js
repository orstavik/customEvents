import {EventRegistry} from "./EventRegistry.js";
import {EventFilterRegistry} from "./EventFilterRegistry.js";

window.customEvents ??= new EventRegistry();
window.customEventFilters ??= new EventFilterRegistry();
//todo don't forget about the native simple event filters.
customEventFilters.define("buttons", (e, suffix) => e.buttons === parseInt(suffix));


//step 1 taking customAttributes and turning them into event filters.
//<form :click:buttons_1:target_type_submit:DomToJson_name_value:ajax_post="bbc.com">

//step 2 we need setTimeout and setInterval and raf and other type of counters to be events.
//       target.addEventListener("timeout20:filter_2:reaction_X", cb, ...args)

function monkeypatchCustomEventsAdd(OG) {
  return function addEventListener_customEvents(type, cb, ...args) {
    const cbFilterName = customEventFilters.defineAnonymous(cb);
    const customAttributeName = type + ":" + cbFilterName;
    if (this.hasAttribute(customAttributeName))
      return; //throw new Error("omg you are trying to add the same event listener twice.");//native behavior is just to dead end it.
    this.setAttribute(customAttributeName, "");
    const customAttribute = this.getAttributeNode(customAttributeName);
    const [event, ...filters] = type.split(":");
    filters.push(cbFilterName);
    let filterFunction = customEventFilters.mostEfficientChainFutureProof(filters);
    const {Definition, suffix} = customEvents.find(event) || {};
    if (Definition) {
      Definition.addedToTargetCallback(suffix, filterFunction, customAttribute, this);
      if (!Definition.noListener)
        OG.call(this, event, filterFunction, ...args);
    } else {
      //todo this is the need to upgrade the event definition. We need to remove the old event listeners.
      customEvents.addUnknownEvents(event, {target: this, filterFunction, customAttribute, args});
      OG.call(this, event, filterFunction, ...args);
    }
  }
}

function monkeypatchCustomEventsRemove(OG) {
  return function removeEventListener_customEvents(type, cb, ...args) {
    const cbFilterName = getFilterForCb(cb);
    const customAttributeName = type + ":" + cbFilterName;
    const customAttribute = this.getAttributeNode(customAttributeName);
    //todo

    OG.call(this, type, cb, ...args);
  }
}

(function (EventTargetOG, addEventListenerOG, removeEventListenerOG) {
  EventTargetOG.prototype.addEventListener = monkeypatchCustomEventsAdd(addEventListenerOG);
})(EventTarget, addEventListener, removeEventListener);