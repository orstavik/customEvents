(function monkeyDefaultAction(Event) {
  const defaultActions = new WeakMap();
  Object.defineProperty(Event.prototype, "defaultAction", {
    get() {
      return !!defaultActions.get(this);
    },
    set(v) {
      if (defaultActions.has(this))
        throw "default actions can only be set once";
      if (!(v instanceof Function))
        throw "defaultActions must be a callable function";
      defaultActions.set(this, v);
      const audio = document.createElement("audio");
      audio.onratechange = _ => this.defaultPrevented || v();
      audio.playbackRate = 2;
    }
  });
})(Event);