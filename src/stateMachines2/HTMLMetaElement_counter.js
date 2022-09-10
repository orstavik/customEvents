export class MetaCaptureHTMLElement extends HTMLMetaElement {

  getCaptureKey(obj) {
    const oldId = this._objToNumber.get(obj);
    if (oldId)
      return oldId;
    const key = this.getCount();
    this._objToNumber.set(obj, key);
    return key;
  }

  resetCaptureKey(key){
    for (let metaMachine of document.head.querySelectorAll(`:scope > meta[capture~="${key}"]`))
      metaMachine !== this && metaMachine.reset();
  }

  getCount() {
    const key = parseInt(this.getAttribute("capture")) + 1; //todo is there an operator that ensures positive integers here?
    this.setAttribute("capture", key);                      //todo what if we surpass max integer??
    return key;
  }

  static upgrade(metaEl) {
    Object.setPrototypeOf(metaEl, this.prototype);
    metaEl._objToNumber = new WeakMap();
  }

  /**
   * Gets a <meta type> element from the <head>.
   * If no <meta type> element is found, adds a <meta type=defaultValue> to the element.
   */
  static singleton(type, defaultValue = "0") {
    let metaEl = document.head.querySelector(`:scope > meta[${type}]`);
    if (!metaEl) {
      metaEl = document.createElement("meta");
      document.head.append(metaEl);
      metaEl.setAttribute(type, defaultValue);
    }
    this.upgrade(metaEl);
    return metaEl;
  }
}