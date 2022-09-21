export class EventFilterRegistry {
  #anonCount = 0;

  define(prefix, Function) {
    const usedFilterName = this.getName(Function);
    if (usedFilterName === prefix)
      return console.warn(`Defining the event filter "${prefix}" multiple times.`);
    if (usedFilterName)
      throw `Function: "${Function.name}" is already defined as event filter "${usedFilterName}".`;
    const overlapDefinition = this.prefixOverlaps(prefix);
    if (overlapDefinition)
      throw `The eventFilter prefix: "${prefix}" is already defined as "${overlapDefinition}".`;
    this[prefix] = Function;
  }

  getName(Function) {
    for (let name in this)
      if (this[name] === Function)
        return name;
  }

  defineAnonymous(Function) {
    let name = this.getName(Function);
    if (name)
      return name;
    name = "anonymous" + this.#anonCount++;
    this[name] = Function;
    return name;
  }

  findPrefix(name) {
    for (let prefix in this)
      if (name.startsWith(prefix))
        return prefix;
  }

  prefixOverlaps(newPrefix) {
    for (let oldPrefix in this)
      if (newPrefix.startsWith(oldPrefix) || oldPrefix.startsWith(newPrefix))
        return oldPrefix;
  }

  findAndBind(name) {
    if (this[name])
      return this[name];         //todo prefix + attr.value? we need to pass in value of the customAttribute
    const prefix = this.findPrefix(name);
    if (!prefix)
      return;
    const cb = this[prefix];
    const suffix = name.substring(prefix.length);
    return this[name] = function (e) {
      return cb.call(this, e, suffix, prefix);//todo attr.value? we need to pass in value of the customAttribute
    };
  }

  chain(filters, key = filters.join(":")) {
    if (this[key])
      return this[key];
    const ready = [];
    for (let i = 0; i < filters.length; i++) {
      ready[i] = this.findAndBind(filters[i]);
      if (!ready)
        return false;
    }
    return this[key] = function compound(...args) {
      for (let func of ready) {
        try {
          const result = func.call(this, ...args);
          if (result === false)
            return false;
          //todo do we want the output of the function to be the thing that the next function works with?
          // This kind of filtering from the functions. It would map with the .chain(..).ing(..).monad(..).thing.
          // The monad would return the same object. This is not what this chaining function does.
          // There is clarity in having fixed arguments. You don't need to worry too much about what comes before or after.
          // but if we don't do the before and after, then we can have a situation of lots of mutations, and that leads to confusion and errors down the line.
        } catch (err) {
          //todo dispatch an async error the same as you get when you get an error from an async function.
          return false;
        }
      }
    }
  }

  futureSingle(name) {
    const customEventFilters = this;
    return function (...args) {
      const foundAndBound = customEventFilters.findAndBind(name);
      return foundAndBound ? foundAndBound.call(this, ...args) : false;
    };
  }

  futureChain(filters, key = filters.join(":")) {
    const customEventFilters = this;
    return function (...args) {
      const foundAndBound = customEventFilters.chain(filters, key);
      return foundAndBound ? foundAndBound.call(this, ...args) : false;
    };
  }

  // alternative to futureChain, not sure which is best for speed.
  //
  // futureCompound(filters) {
  //   const customEventFilters = this;
  //   const readyFilters = [];
  //   return function eventListenerFilter(...args) {
  //     //step 1, ensure that all the filters are ready first, if not abort by returning false
  //     for (let i = readyFilters.length; i < filters.length; i++) {
  //       const boundFilter = customEventFilters.findAndBind(filters[i]);
  //       if (!boundFilter)
  //         return false;
  //       readyFilters[i] = boundFilter;
  //     }
  //     //step 2, process filters one by one, if one filter returns false, it means abort.
  //     for (let filterFunc of readyFilters)
  //       if (filterFunc.call(this, ...args) === false)  //todo try catch it
  //         return false;
  //   };
  // }

  mostEfficientChainFutureProof(filters) {
    if (filters.length === 1)
      return this.findAndBind(filters[0]) || this.futureSingle(filters[0]);
    else
      return this.chain(filters) || this.futureChain(filters);
  }
}