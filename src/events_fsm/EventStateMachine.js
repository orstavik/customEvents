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

export class EventStateMachine {
  #nowState;
  #stateToListenerDict;
  #seenEvents = new WeakSet();

  constructor(owner) {
    this.#stateToListenerDict = this.constructor.fsm();
    this.owner = owner;
    this.#prepareStateMachine(owner);
  }

  //adding the owner as the target.
  //making the listeners. This can be done during the definition stage.
  #prepareStateMachine(owner) {
    for (let state in this.#stateToListenerDict) {
      for (let list of this.#stateToListenerDict[state]) {
        list.length === 3 && list.push(owner);
        list.push(this.#makeListener(list.shift(), list.shift()));
      }
    }
  }

  #makeListener(nextState, action) {
    return e => {
      if (this.#seenEvents.has(e))
        return;
      if (action(e, this.owner) === false)
        return;
      this.#seenEvents.add(e);
      this.#transition(nextState);
    }
  }

  #transition(nextState) {
    if (this.#nowState)
      for (let [event, target, listener] of this.#stateToListenerDict[this.#nowState])
        target.removeEventListener(event, listener);
    this.#nowState = nextState;
    if (this.#nowState)
      for (let [event, target, listener] of this.#stateToListenerDict[this.#nowState])
        target.addEventListener(event, listener);
  }

  init(startState = Object.keys(this.#stateToListenerDict)[0]) {
    this.#transition(startState);
  }

  destructor() {
    this.#transition();
  }
}