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
          ["start", Swipe.reset, "pointerup", window],
          ["start", Swipe.reset, "blur", window],
          ["start", Swipe.reset, "selectstart", window],
          ["start", Swipe.reset, "pointerdown", window],

          ["active", Swipe.activate, "pointermove_1", window],
        ],
        active: [
          ["start", Swipe.cancel, "pointermove_prevented", window],
          ["start", Swipe.cancel, "pointermove_outofbounds", window],
          // ["start", Swipe.cancel, "pointerup", window],   //todo we probably need a filter on this pointerup event.
          ["start", Swipe.cancel, "blur", window],
          ["start", Swipe.cancel, "selectstart", window],
          ["start", Swipe.cancel, "pointerdown", window],

          ["start", Swipe.complete, "pointerup", window],
        ]
      };
    }

    static get capturePhases(){
      return {
        start: "reset",
        observe: "observe",
        active: "capture"
      }
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
      //todo use the meta instead of the owner to cache the default userSelect state
      this.owner.style.setProperty("--userSelectDefault", this.owner.style.userSelect);
      this.owner.style.userSelect = "none";
    }

    static startObserving(e, instance) {
      return {x: e.x, y: e.y, timeStamp: e.timeStamp, target: e.target, id: e.target.id};
    }

    static reset(e, instance) {
    }

    static activate(e, instance) {
      if (!Swipe.longEnough(instance.meta.value, e))
        return false;
      return instance.meta.value;
    }

    static cancel(e, instance) {
      nextTick(_ => instance.meta.target.dispatchEvent(new SwipeEvent(this.prefix + "cancel", {reason: e.type})));
    }

    static complete(end, {meta: {target, value: start}}) {
      //todo how to make the best structure for freezing and resurrecting event objects in and out of JSON
      if(start.target instanceof Event){
        target = start.target;
      } else if(target.id !== start.id) {
        let idTarget = target.querySelector("#"+start.id);
        if(idTarget)
          target = idTarget;
      }
      end.defaultAction = _ => target.dispatchEvent(new SwipeEvent(this.prefix, {start, end}));
    }

    destructor() {
      this.owner.style.userSelect = this.owner.style.getPropertyValue("--userSelectDefault");
      this.owner.style.removeProperty("--userSelectDefault");
      super.destructor();
    }
  };
}