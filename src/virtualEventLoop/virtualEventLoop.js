function deprecate(name) {
  return function deprecated() {
    throw `${name}() is deprecated`;
  }
}

(function (
  Element_proto,
  EventTarget_proto,
  Event_proto,
  documentCreateAttributeOG,
  getAttrOG = Element_proto.getAttribute,
  setAttrOG = Element_proto.setAttribute,
  removeAttrOG = Element_proto.removeAttribute,
  getAttrNodeOG = Element_proto.getAttributeNode,
  setAttributeNodeOG = Element_proto.setAttributeNode,
  stopImmediatePropagationOG = Event_proto.stopImmediatePropagation,
  preventDefault = Event_proto.preventDefault,
  composedPathOG = Event_proto.composedPath,
  removeEventListenerOG = EventTarget_proto.removeEventListener,
  addEventListenerOG = EventTarget_proto.addEventListener
) {
  Element.prototype.hasAttributeNS = deprecate("Element.hasgetAttributeNS");
  Element.prototype.getAttributeNS = deprecate("Element.getAttributeNS");
  Element.prototype.setAttributeNS = deprecate("Element.setAttributeNS");
  Element.prototype.removeAttributeNS = deprecate("Element.removeAttributeNS");
  Element.prototype.getAttributeNode = deprecate("Element.getAttributeNode");
  Element.prototype.setAttributeNode = deprecate("Element.setAttributeNode");
  Element.prototype.removeAttributeNode = deprecate("Element.removeAttributeNode");
  Element.prototype.getAttributeNodeNS = deprecate("Element.getAttributeNodeNS");
  Element.prototype.setAttributeNodeNS = deprecate("Element.setAttributeNodeNS");
  Element.prototype.removeAttributeNodeNS = deprecate("Element.removeAttributeNodeNS");
  document.createAttribute = deprecate("document.createAttribute");

  function nativeRerouteListener(e) {
    // preventDefault.call(e); // if dispatchEvent propagates sync, native defaultActions can still be used.
    stopImmediatePropagationOG.call(e);
    composedPathOG.call(e)[0].dispatchEvent(e);
  }

  document.addEventListener("readystatechange", _ => { //todo hack to make it work with the parse.js script
    EventTarget_proto.addEventListener = function (type, cb, ...args) {
      const cbName = customEventFilters.defineAnonymous(cb);
      this.setAttribute(type + ":" + cbName);
    };
    EventTarget_proto.removeEventListener = function (type, cb, ...args) {
      const cbName = customEventFilters.defineAnonymous(cb);
      this.removeAttribute(type + ":" + cbName);
    };
  });
  EventTarget_proto.dispatchEvent = function dispatchEvent(event) {
    for (let t = this; t; t = t.assignedSlot || t.parentNode instanceof HTMLElement ? t.parentNode : t.parentNode?.host)
      for (let attr of t.attributes)
        if (attr.name.startsWith(event.type + ":"))
          customEventFilters.getFilterFunction(attr.name.substring(event.type.length + 1))?.call(attr, event);
  }

  function getNativeEventName(at) {
    const parts = at.name.split(":");
    const isNativeProperty = ("on" + parts[0]) in HTMLElement.prototype;
    return parts.length > 1 && isNativeProperty && parts[0];
  }

  function newAttribute(at) {
    const event = getNativeEventName(at);
    event && addEventListenerOG.call(at.ownerElement, event, nativeRerouteListener);
  }

  function updateAttribute(at, oldValue) {
    at.onChangeCallback?.(oldValue);
  }

  function removeAttribute(at) {
    const event = getNativeEventName(at);
    if (event && ![...at.ownerElement.attributes].find(o => o !== at && o.name.startsWith(event + ":")))
      removeEventListenerOG.call(at.ownerElement, event, nativeRerouteListener);
  }

  Element_proto.setAttribute = function (name, value) {
    if (this.hasAttribute(name)) {
      const at = getAttrNodeOG.call(this, name);
      const oldValue = at.value;
      at.value = value;
      updateAttribute(at, oldValue);
    } else {
      const at = documentCreateAttributeOG.call(document, name);
      if (value !== undefined)
        at.value = value;
      setAttributeNodeOG.call(this, at);
      newAttribute(at);
      updateAttribute(at);
    }
  };

  Element_proto.removeAttribute = function (name) {
    removeAttribute(getAttrNodeOG.call(this, name));
    removeAttrOG.call(this, name);
  };

  //todo we need to run the upgrade process for the customEvents (not needed for customEventFilters),
  // both after definition, and after "loading from template".
  //todo this means that we need to make a map of eventNames => weakArray of attributes.
  ElementObserver.end(el => {
    for (let at of el.attributes)
      newAttribute(at);
  });
})(Element.prototype, EventTarget.prototype, Event.prototype, document.createAttribute);