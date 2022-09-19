import {ReflectStateMachine} from "./PseudoHostStateMachine.js";
import {EventStateMachine} from "./EventStateMachine.js";
import {NodeStateMachine} from "./StateMachine.js";

const EventStateMachine_reflective = EventStateMachine(ReflectStateMachine(NodeStateMachine));

export class PressEvent extends PointerEvent {
  #start;
  #end;

  constructor(type, {start, end}) {
    super(type, {bubbles: true, composed: true});
    this.#start = start;
    this.#end = end;
  }

  get duration() {
    return this.#end.timeStamp - this.#start.timeStamp;
  }
}

export function createLongPress({minDuration = 350, minDistance = 50, direction} = {}) {
  return class Swipe extends EventStateMachine_reflective {
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
          // ["start", Swipe.cancel, "pointerup_filter??", window],   //todo
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