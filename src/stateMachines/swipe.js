import {NodeStateMachine} from "./StateMachine.js";
import {PersistStateMachine} from "./ResurrectableStateMachine.js";
import {ReflectStateMachine} from "./PseudoHostStateMachine.js";
import {EventStateMachine} from "./EventStateMachine.js";

const EventStateMachine_resurrectable_reflective = EventStateMachine(ReflectStateMachine(PersistStateMachine(NodeStateMachine)));

class SwipeEvent extends PointerEvent {
  #options;

  constructor(type, options) {
    super(type, {bubbles: true, composed: true});
    this.#options = options;
  }

  get direction() {
    return (this.#options.swipeDistY < 0 ? "top" : "down") + "-" + (this.#options.swipeDistX > 0 ? "right" : "left");
  }

  //step 1 would be to make it in degrees? turn two sets of coordinates into a degree
  //step 2 mark
  //this is a getter.
  //         north/up = > 300 || north < 60
  //         south/down = > 120 && < 240
  //         east/right = > 120 && < 240
  //         west/left = > 120 && < 240
  //         north-east / north /??
  //         horisontal ()narrower focus
  //         vertical
  //getter for acceleration
  //getter for speed
}

//todo direction is for horizontal-only / vertical-only

export function createSwipe({minDuration = 350, minDistance = 50, direction} = {}) {
  return class Swipe extends EventStateMachine_resurrectable_reflective {
    static fsm() {
      return {
        start: [
          ["observe", Swipe.startObserving, "pointerdown_1"]
        ],
        observe: [
          ["start", Swipe.reset, "pointermove_prevented", window],          //this check should be done after the propagation has finished too..
          ["start", Swipe.reset, "pointermove_outofbounds", window],        //this event controller needs to react to the preventDefault on the pointer move,
                                                                            //also when this is called later in the propagation hierarchy.
          ["active", Swipe.activate, "pointermove_1", window],

          ["start", Swipe.reset, "pointerup", window],
          ["start", Swipe.reset, "blur", window],
          ["start", Swipe.reset, "selectstart", window],
          ["start", Swipe.reset, "pointerdown", window],
        ],
        active: [
          ["start", Swipe.complete, "pointerup", window],

          ["start", Swipe.cancel, "pointermove_prevented", window],
          ["start", Swipe.cancel, "pointermove_outofbounds", window],
          ["start", Swipe.cancel, "pointerup", window],
          ["start", Swipe.cancel, "blur", window],
          ["start", Swipe.cancel, "selectstart", window],
          ["start", Swipe.cancel, "pointerdown", window],
        ]
      };
    }

    static longEnough(start, now) {
      return ((now.timeStamp - start.timeStamp) > minDuration) &&
        Math.abs(now.x - start.x) > minDistance || Math.abs(now.y - start.y) > minDistance;
    }

    constructor(prefix, owner) {
      super(prefix, owner);
      owner.style.setProperty("--userSelectDefault", owner.style.userSelect);
      owner.style.userSelect = "none";
    }

    static startObserving(e, owner, state) {
      return {x: e.x, y: e.y, timeStamp: e.timeStamp};
    }

    static reset(e, owner, state) {
    }

    static activate(e, owner, state) {
      if (!Swipe.longEnough(state, e))
        return false;
      return state;
    }

    static cancel(e, owner, state) {
      nextTick(_ => owner.dispatchEvent(new SwipeEvent("swipecancel", {reason: e.type})));
    }

    static complete(e, owner, state) {
      e.defaultAction = _ => {
        owner.dispatchEvent(new SwipeEvent("swipe", {swipeDistX: e.x - state.x, swipeDistY: e.y - state.y, duration: e.timeStamp - state.timeStamp}));
      }
    }

    destructor() {
      this.owner.style.userSelect = this.owner.style.getPropertyValue("--userSelectDefault");
      this.owner.style.removeProperty("--userSelectDefault");
      super.destructor();
    }
  };
}