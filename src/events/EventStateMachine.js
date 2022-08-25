function makeListener(seen, machine, owner, state, nextState, action) {
  return function (e) {
    if (seen.has(e))
      return;
    if (action(e, owner) === false)
      return;
    seen.add(e);
    for (let [listener, , , event, target = owner] of machine[state])
      target.removeEventListener(event, listener);
    for (let [listener, , , event, target = owner] of machine[nextState])
      target.addEventListener(event, listener);
  }
}

export class EventStateMachine {
  constructor(owner) {
    const seen = new WeakSet();
    const machine = this.constructor.fsm();
    //making the listeners. This can be done during the definition stage.
    for (let state in machine)
      for (let list of machine[state])
        list.unshift(makeListener(seen, machine, owner, state, ...list));
    //starting the first listeners
    for (let [listener, , , event, target = owner] of machine[Object.keys(machine)[0]])
      target.addEventListener(event, listener);
  }
}