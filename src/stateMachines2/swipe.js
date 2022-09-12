import {ReflectStateMachine} from "./PseudoHostStateMachine.js";
import {EventStateMachine} from "./EventStateMachine.js";
import {NodeStateMachine} from "./StateMachine.js";

const EventStateMachine_resurrectable_reflective = EventStateMachine(ReflectStateMachine(NodeStateMachine));

export class SwipeEvent extends PointerEvent {
  #start;
  #end;

  constructor(type, {start, end}) {
    super(type, {bubbles: true, composed: true});
    this.#start = start;
    this.#end = end;
  }

  get direction() {
    return (this.#end.y - this.#start.y < 0 ? "top" : "down") +
      "-" + (this.#end.x - this.#start.x > 0 ? "right" : "left");
  }

  get duration() {
    return this.#end.timeStamp - this.#start.timeStamp;
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

    static defaultState() {
      return {state: "start", value: undefined};
    }

    static longEnough(start, now) {
      return ((now.timeStamp - start.timeStamp) > minDuration) &&
        Math.abs(now.x - start.x) > minDistance || Math.abs(now.y - start.y) > minDistance;
    }

    constructor(meta) {
      super(meta);
      this.owner.style.setProperty("--userSelectDefault", this.owner.style.userSelect);
      this.owner.style.userSelect = "none";
    }

    static startObserving(e, owner, state, meta) {
      meta.observe(e);
      //todo here we need to add the e.target to the state. And this needs to be done in a freeze state
      //todo here we need to do a relatedTarget
      //todo we have listener target, and then we have multiple other targets, and we need to preserve those targets.
      return {x: e.x, y: e.y, timeStamp: e.timeStamp};
    }

    static reset(e, owner, state, meta) {
      meta.removeAttribute("capture");
    }

    static activate(e, owner, state, meta) {
      if (!Swipe.longEnough(state, e))
        return false;
      meta.capture();
      return state;
    }

    static cancel(e, owner, state, meta) {
      nextTick(_ => meta.target.dispatchEvent(new SwipeEvent(this.prefix + "cancel", {reason: e.type})));
    }

    static complete(end, owner, start, meta) {
      //todo here we would like the swipe event to be dispatched from the start.target.
      // this means that we need to preserve the event element as an object in the state,
      // and as a reference to an <event-> element in the <event-loop> in the meta-swipe element.
      // this will also cause the reconstruction to create an Event object that can be called preventDefault() on
      // and that will
      end.defaultAction = _ => meta.target.dispatchEvent(new SwipeEvent(this.prefix, {start, end}));
    }

    destructor() {
      this.owner.style.userSelect = this.owner.style.getPropertyValue("--userSelectDefault");
      this.owner.style.removeProperty("--userSelectDefault");
      super.destructor();
    }
  };
}