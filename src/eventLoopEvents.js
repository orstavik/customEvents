class EventHTMLElement extends HTMLElement {
  get event() {
    if (this._event)
      return this._event;
    const type = this.getAttribute("type");
    const constructor =
      type.startsWith("mouse") ? MouseEvent :
        type.startsWith("pointer") ? PointerEvent :
          type.startsWith("touch") ? TouchEvent :
            type.startsWith("key") ? KeyboardEvent :
              Event;
    const reconstructed = new constructor(type, {
      x: this.getAttribute("x"),
      y: this.getAttribute("y"),
      key: this.getAttribute("key")
    });
    Object.defineProperty(reconstructed, "target", {
      get: function () {
        return document.querySelector(this.getAttribute("target"));
      }
    });
    return this._event = reconstructed;
  }

  set event(e) {
    if (this._event === undefined)
      this._event = e;
  }

  static create(e) {
    const el = document.createElement("event-");
    el._event = e;
    Object.setPrototypeOf(el, EventHTMLElement.prototype);
    el.id = "e" + (id++);
    el.setAttribute("type", e.type);
    el.setAttribute("timeStamp", e.timeStamp);
    e.x !== undefined && el.setAttribute("x", e.x);
    e.y !== undefined && el.setAttribute("y", e.y);
    e.key !== undefined && el.setAttribute("key", e.key);
    const target = e.target.tagName + (e.id === undefined ? "" : ("#" + e.id));
    el.setAttribute("target", target);
    return el;
  }
}

let id = 0;

class EventLoop extends HTMLElement {
  put(e) {
    this.prepend(EventHTMLElement.create(e));
    if (this.children.length > 500)
      this.lastChild.remove();
  }
}

export function makeOverwriteableEventLoopDefinition() {
  const el = document.createElement("event-loop");
  document.head.append(document.head.eventLoop = el);
  Object.setPrototypeOf(el, EventLoop.prototype);
}

const listenListen = new WeakMap();
const seen = new WeakSet();

export function monkeypatchEventLoopElement_add(OG) {
  return function addEventListener_eventLoop(type, cb, ...args) {
    let wrapped = listenListen.get(cb);
    if (!wrapped) {
      wrapped = function eventListenerWithWrapper(e) {
        if (!seen.has(e)) {
          seen.add(e);
          document.head.eventLoop.put(e);
        }
        cb(e);
      }
      listenListen.set(cb, wrapped);
    }
    OG.call(this, type, wrapped, ...args);
  }
}

export function monkeypatchEventLoop_remove(OG) {
  return function removeEventListener_eventLoop(type, cb, ...args) {
    const wrapped = listenListen.get(cb) || cb;
    OG.call(this, type, wrapped, ...args);
  }
}

//todo one for overwriteable definitions, and
// one where you want the default definition to be customElements.define(..) by default, immediately.

//
// customElements.define("event-loop", class MyEventLoopElement extends HTMLElement {
//
//   put(event) {
//     //...;
//   }
// });
//
