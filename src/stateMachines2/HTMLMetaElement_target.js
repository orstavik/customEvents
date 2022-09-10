const locked = new WeakMap();

export class StateHTMLMetaElement extends HTMLElement {

  get state() {
    const state = this.getAttribute("state");
    let stateValue = this.hasAttribute("statevalue") ? JSON.parse(this.getAttribute("statevalue")) : undefined;
    return {state, stateValue};
  }

  set state({state, stateValue}) {
    this.#toggleAttribute("state", state);
    this.#toggleAttribute("statevalue", statevalue);
  }

  #toggleAttribute(key, value) {
    value && key ? this.setAttribute(key, JSON.stringify(value)) : this.removeAttribute(key);
  }

  static upgrade(metaEl) {
    Object.setPrototypeOf(metaEl, this.prototype);
  }

  static singleton(type, value, key) {
    let metaEl = document.head.querySelector(`:scope > meta[${type}=${value}]`);
    if (key !== locked.get(metaEl))
      throw new Error("Wrong key for <meta> element.");
    if (!metaEl) {
      metaEl = document.createElement(`meta`);
      metaEl.setAttribute(type, value);
      document.head.append(metaEl);
    }
    locked.set(metaEl, key);
    this.upgrade(metaEl);
    return metaEl;
  }
}