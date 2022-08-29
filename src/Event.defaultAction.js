//mutate the target, currentTarget, path, composedPath of an Event object.
function rewind(event, currentTarget, target, path, composedPath) {
  Object.defineProperties(event, {
    "currentTarget": {value: currentTarget},
    "target": {value: target},
    "path": {value: path},
    "composedPath": {value: composedPath}
  });
}

export function nextTick(cb){
  const audio = document.createElement("audio");
  audio.onratechange = cb;
  audio.playbackRate = 2;
}

export function monkeyDefaultAction(Event) {
  const defaultActions = new WeakMap();
  Object.defineProperty(Event.prototype, "defaultAction", {
    get() {
      return !!defaultActions.get(this);
    },
    set(v) {
      if (!(v instanceof Function))
        throw "defaultActions must be a callable function";
      if (defaultActions.has(this))
        return;
      defaultActions.set(this, v);
      const current = this.currentTarget;
      const target = this.target;
      const path = this.path;              //path and composedPath will work with closed and open shadowDoms,
      const composed = this.composedPath();//as they are read at the same position as the callback.
      nextTick(_ => this.defaultPrevented || rewind(this, current, target, path, () => composed) || v(this));
    }
  });
}