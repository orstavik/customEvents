class EventRegistry {
  #unknownEvents = {};

  define(prefix, Class) {
    const overlapDefinition = this.prefixOverlaps(prefix);
    if (overlapDefinition)
      throw `The customEvent "${prefix}" is already defined as "${overlapDefinition}".`;
    if (Class.prefix)
      throw `${Class.name} definition is already used (${Class.name}.prefix === "${Class.prefix}"). 
    What about 'customEvents.define("${prefix}", class Something extends ${Class.name}{});'?`;
    Class.prefix = prefix;
    this[prefix] = Class;
    this.upgradeUnknownEvents(prefix, Class);
  }

  getName(Class) {
    for (let name in this)
      if (this[name] === Class)
        return name;
  }

  find(name) {
    for (let def in this)
      if (name.startsWith(def))
        return {prefix: def, Definition: this[def], suffix: name.substring(def.length)};
  }

  prefixOverlaps(newPrefix) {
    for (let oldPrefix in this)
      if (newPrefix.startsWith(oldPrefix) || oldPrefix.startsWith(newPrefix))
        return oldPrefix;
  }

  addUnknownEvents(event, {target, filterFunction, customAttribute, args}) {
    (this.#unknownEvents[event] ??= []).push({target, filterFunction, customAttribute, args});
  }

  upgradeUnknownEvents(prefix, Definition) {
    for (let event in this.#unknownEvents) {
      if (event.startsWith(prefix)) {
        for (let {target, filterFunction, customAttribute, args} of this.#unknownEvents[event]) {
          target.removeEventListener(event, filterFunction, ...args);
          //todo surround in try/catch
          //todo dispatch async error.
          Definition.addedToTargetCallback(event, filterFunction, customAttribute, target);
          //Definition.upgradeOnTarget(); todo
        }
      }
    }
  }
}

window.customEvents = new EventRegistry();