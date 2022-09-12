function upgradeMeta(meta, target, targets) {
  Object.defineProperties(meta, {
    "target": {
      configurable: false, get() {
        return target
      }
    }
  }, {
    "targets": {
      configurable: false, get() {
        return targets
      }
    }
  });
  return meta;
}

export function getOrMakeMeta(attr, target) {
  if (!target.isConnected) throw new Error("PersistentEventStateMachines can only be added to elements already connected to the DOM.");
  const targets = hostChain(target);
  const id = shadowDomQuerySelector(target, targets);
  let meta = document.head.querySelector(`:scope > meta[${attr}=${id}]`);
  if (!meta) {        //no meta, making a new one
    meta = document.createElement(`meta`);
    meta.setAttribute(attr, id);
    document.head.append(meta);
    return upgradeMeta(meta, target, targets);
  }
  if (meta.target === target)
    throw "unknown bug.";
  if (meta.target !== undefined)
    throw new Error("Two state machines try to connect to the same <meta> element.");
  return upgradeMeta(meta, target, targets);    //resurrection meta
}

//todo this might not be persistable if a shadowDom gives IDs dynamically during construction.
// This will only work if IDs are assigned to elements in shadowDOM so that the same elements
// get the same ID whenever it is reconstructed.
function shadowDomQuerySelector(el, hosts) {
  const ids = hosts.map(el => el.id);
  if (!ids.every(id => id)) throw `A uid cannot be created for the given state machine: ${el.tagName}`;
  return ids.join(" >> ");
}

export function hostChain(el) {
  const res = [];
  for (; el; el = el.getRootNode()?.host) res.unshift(el);
  return res;
}