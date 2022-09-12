export class CaptureCounter {
  #count;
  #objToNumber = new WeakMap();

  constructor(type) {
    this.#count = 0;
    for (let el of document.head.querySelectorAll(`:scope > meta[${type}]`))
      this.#count = Math.max(this.#count, ...[...el.getAttribute(type)].split(" ").map(c => parseInt(c)));
  }

  getCaptureKey(obj) {
    let num = this.#objToNumber.get(obj);
    if (!num)
      this.#objToNumber.set(obj, num = ++this.#count);
    return num;
  }
}