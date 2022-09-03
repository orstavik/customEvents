import {NodeStateMachine} from "./StateMachine.js";

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

export function EventStateMachine(Base) {
  NodeStateMachine.protoInstanceOf(Base);

  return class EventStateMachine extends Base {
    #seenEvents = new WeakSet();
    #_stateToListenerDict;

    constructor(owner, prefix) {
      super(owner, prefix);
      if (!this.state)  //if no superclass has triggered enterState, then do so using the first state in the list.
        this.enterState(Object.keys(this.#stateToListenerDict)[0]);
    }

    //This cannot be done in the constructor, but must be done on demand.
    // The reason is that super class constructors may call enterState or leaveState
    // that depend on the #stateToListenerDict property.
    // Therefore, this property must be constructed on first demand, and not during this class construction time
    // (as this class' construction time might be too late).
    get #stateToListenerDict() {
      if (!this.#_stateToListenerDict) {
        this.#_stateToListenerDict = this.constructor.fsm();
        for (let state in this.#_stateToListenerDict) {
          for (let list of this.#_stateToListenerDict[state]) {
            list.length === 3 && list.push(this.owner);
            list.push(this.#makeListener(list.shift(), list.shift()));
          }
        }
      }
      return this.#_stateToListenerDict;
    }

    enterState(nextState, nextStateValue) {
      super.enterState(nextState, nextStateValue);
      for (let [event, target, listener] of this.#stateToListenerDict[nextState])
        target.addEventListener(event, listener);
    }

    leaveState() {
      for (let [event, target, listener] of this.#stateToListenerDict[this.state])
        target.removeEventListener(event, listener);
      super.leaveState();
    }

    destructor() {
      //super.destructor() will remove this.state, and
      //therefore the sub class must run this functionality before the super class.
      for (let [event, target, listener] of this.#stateToListenerDict[this.state])
        target.removeEventListener(event, listener);
      super.destructor();
    }

    #makeListener(nextState, action) {
      return e => {
        if (this.#seenEvents.has(e))
          return;
        const nextStateValue = action(e, this.owner, this.stateValue);
        if (nextStateValue === false)   //todo make the next state value from false to undefined, or throw??
          return;
        this.#seenEvents.add(e);
        this.leaveState();
        this.enterState(nextState, nextStateValue);
      }
    }
  }
}