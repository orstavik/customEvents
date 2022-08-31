/*
 * Rules for EventStateMachine:
 * 1. The event controller must be in one of the given states.
 * 2. The event controller starts in the first listed state.
 * 3. Each state is a list of transitions to the next state(s).
 * 4. A transition is made up of the nextState's name, the action (function), and the trigger event's name and target.
 * 5. When the trigger event occurs, it is passed to the action function.
 *    The action function is successful if it does not return false.
 * 6. If the action is successful, no other state change triggers will run for this event for this state machine.
 *    This means that the sequence of the transitions for each state is important as the first successful action will win.
 * 7. The action/transition and state change is performed sync during event propagation.
 * 8. Side-effects should be one of two things:
 *    A. Set/remove/update protected attribute. The protected attributes reflect the state of the event controller.
 *    B. dispatch new event(s). Event dispatches should be done async:
 *       B1. successful steps in the anticipated direction are commonly added as the default action on the trigger event.
 *       B2. cancellation steps are commonly added as new macro tasks in the event loop using nextTick (not as default actions).
 */

function makeListener(seen, machine, owner, state, nextState, action) {
  return function (e) {
    if (seen.has(e))
      return;
    if (action(e, owner) === false)
      return;
    seen.add(e);
    for (let [listener, , , event, target] of machine[state])
      target.removeEventListener(event, listener);
    for (let [listener, , , event, target] of machine[nextState])
      target.addEventListener(event, listener);
  }
}

export class EventStateMachine {
  constructor(owner) {
    const seen = new WeakSet();
    const machine = this.constructor.fsm();
    //making the listeners. This can be done during the definition stage.
    for (let state in machine) {
      for (let list of machine[state]) {
        list.length === 3 && list.push(owner);
        list.unshift(makeListener(seen, machine, owner, state, ...list));
      }
    }
    //starting the first listeners
    for (let [listener, , , event, target] of machine[Object.keys(machine)[0]])
      target.addEventListener(event, listener);
  }

  destructor(){
    //todo remove the event listeners on the machine[state] currently active.
    // for (let [listener, , , event, target = owner] of machine[currentState])
    //   target.removeEventListener(event, listener);
    //todo we need to have the machine and the currentState as this.xyz. If not, we can't cleanup.
  }
}