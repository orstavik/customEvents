import {NodeStateMachine} from "./StateMachine.js";
import {CaptureCounter} from "./HTMLMetaElement_counter.js";

const captureCounter = new CaptureCounter("capture");

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
  if (NodeStateMachine !== Base && !NodeStateMachine.isPrototypeOf(Base))
    throw new TypeError(`${Base.name} is not a subclass of NodeStateMachine.`);

  return class EventStateMachine extends Base {
    #seenEvents = new WeakSet();
    #_stateToListenerDict;

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
      for (let [event, target, listener] of this.#stateToListenerDict[this.state])
        target.removeEventListener(event, listener);
      super.destructor();
    }

    #makeListener(nextState, transition) {
      return e => {
        if (this.#seenEvents.has(e))
          return;
        const nextStateValue = transition.call(this.constructor, e, this);// this.owner, this.stateValue, this.meta); //this
        if (nextStateValue === false)   //todo make the next state value from false to undefined, or throw??
          return;
        this.#seenEvents.add(e);
        this.leaveState();
        this.#captureTransition(nextState, e);
        this.enterState(nextState, nextStateValue);
      }
    }

    #captureTransition(nextState, e) {
      const captureType = this.constructor.capturePhases?.[nextState];
      if (captureType === "reset")
        this.meta.removeAttribute("capture");
      else if (captureType === "capture") {
        const queryAllMatching = this.meta.getAttribute("capture").split(" ").map(key => `:scope > meta[capture~="${key}"]`).join(", ");
        for (let meta of document.head.querySelectorAll(queryAllMatching)) {
          if (meta !== this.meta) {
            meta.reset();
            meta.removeAttribute("capture");
          }
        }
      } else if (captureType === "observe") {
        const metaId = captureCounter.getCaptureKey(e);
        const val = this.meta.getAttribute("capture");
        this.meta.setAttribute("capture", val ? val + " " + metaId : metaId);
      }
      //else no capturing is done for this state change.
    }
  }
}