export function monkeyEventCapture(Event) {
  //1. Make sure that the counter starts after any lingering/frozen <meta capture="number"> from frozen html code
  let count = 0;
  for (let el of document.head.querySelectorAll(`:scope > meta[capture]`))
    count = Math.max(count, ...el.getAttribute("capture").split(" "));
  count++;
  //2. eventToKey creates an immutable, read-only captureKey id for each event object
  let eventToKey = new WeakMap();
  Object.defineProperty(Event.prototype, "captureKey", {
    get() {
      let num = eventToKey.get(this);
      if (!num)
        eventToKey.set(this, num = count++);
      return num;
    }
  });
}