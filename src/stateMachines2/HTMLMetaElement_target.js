const locked = new WeakMap();

export function getOrMakeMeta(attr, target) {
  const lock = target;
  const id = shadowDomQuerySelector(target);
  let meta = document.head.querySelector(`:scope > meta[${attr}=${id}]`);
  if (locked.has(meta) && lock !== locked.get(meta))
    throw new Error("Two state machines try to connect to the same <meta> element.");
  if (!meta) {
    meta = document.createElement(`meta`);
    meta.setAttribute(attr, id);
    document.head.append(meta);
  }
  locked.set(meta, lock);
  return meta;
}

//todo this might not be persistable if a shadowDom gives IDs dynamically during construction.
// This will only work if IDs are assigned to elements in shadowDOM so that the same elements
// get the same ID whenever it is reconstructed.
function shadowDomQuerySelector(el) {
  if (!el.isConnected)
    throw new Error("PersistentEventStateMachines can only be added to elements already connected to the DOM.");
  const ids = hostChain(el).map(el => el.id);
  if (!ids.every(id => id))
    throw `A uid cannot be created for the given state machine: ${el.tagName}`;
    return ids.join(" >> ");
}

export function hostChain(el) {
  const res = [];
  for (; el; el = el.getRootNode()?.host)
    res.unshift(el);
  return res;
}