//the default action is a method/function that is passed the event with the currentTarget, target, path and composedPath
// "back set" to the value of when the default action was made.
function rewindPath(event, currentTarget, target, path, composedPath) {
  Object.defineProperties(event, {
    "currentTarget": {value: currentTarget},
    "target": {value: target},
    "path": {value: path},
    "composedPath": {
      value: function () {
        return composedPath
      }
    },
  });
}

export function monkeyDefaultAction(Event) {
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
      const currentTarget = this.currentTarget;
      const target = this.target;
      const path = this.path;
      const composedPath = this.composedPath();
      //these values will work with closed and open shadowDoms alike. As they are read at the similar hierarchy position during propagation.
      defaultActions.set(this, v);
      const audio = document.createElement("audio");
      audio.onratechange = _ => this.defaultPrevented || v(rewindPath(this, currentTarget, target, path, composedPath));
      audio.playbackRate = 2;
    }
  });
}