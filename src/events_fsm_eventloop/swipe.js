import {EventStateMachine} from "./EventStateMachine.js";

class SwipeEvent extends PointerEvent {
  #options;

  constructor(type, options) {
    super(type, {bubbles: true, composed: true});
    this.#options = options;
  }

  get direction() {
    const direction = this.#options.swipeDistY < 0 ? "top" : "down";
    return direction + "-" + (this.#options.swipeDistX > 0 ? "right" : "left");
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
  return class Swipe extends EventStateMachine {
    static fsm() {
      return {
        start: [
          ["observe", Swipe.startObserving, "pointerdown-buttons1"]
        ],
        observe: [
          //as the secondary event listeners in the gesture is attached to the window,
          //the preventDefault will work as long as the listener calling preventDefault is added to the window itself.
          //This can be supported by having all event listeners on window be passive: true.
          ["start", Swipe.reset, "pointermove-prevented", window],
          ["start", Swipe.reset, "pointermove-outofbounds", window],

          ["active", Swipe.activate, "pointermove-buttons1", window],

          ["start", Swipe.reset, "pointerup", window],
          ["start", Swipe.reset, "blur", window],
          ["start", Swipe.reset, "selectstart", window],
          ["start", Swipe.reset, "pointerdown", window],
        ],
        active: [
          ["start", Swipe.complete, "pointerup-buttons1", window],

          ["start", Swipe.cancel, "pointermove-prevented", window],
          ["start", Swipe.cancel, "pointermove-outofbounds", window],
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

    #owner;

    constructor(owner) {
      super(owner);
      this.#owner = owner;
      owner.style.setProperty("--userSelectDefault", owner.style.userSelect);
      owner.style.userSelect = "none";
    }

    //todo following the :hover principle, we should update the ::swipe-observe in a consistent raf-loop.
    //todo and the ::swipe-observe is a css pseudo-class.
    //todo so, we would be making a pattern for css pseudo-classes.
    static startObserving(e, owner) {
      //todo we need the startEvent target to be resumable.
      //todo we need to mark the documents downwards?? and upwards?? with the swipe observe?
      owner.setAttribute("::swipe-observe", document.head.eventLoop.firstChild.id); //the firstChild is the current event loop
    }

    static reset(e, owner) {
      owner.removeAttribute("::swipe-observe");
    }

    static activate(e, owner) {
      let el = document.head.eventLoop.querySelector("#" + owner.getAttribute("::swipe-observe"));
      const startEvent = el.event;
      if (!Swipe.longEnough(startEvent, e))
        return false;
      owner.setAttribute("::swipe-active", document.head.eventLoop.firstChild.id);
    }

    static cancel(e, owner) {
      owner.removeAttribute("::swipe-observe");
      owner.removeAttribute("::swipe-active");
      nextTick(_ => owner.dispatchEvent(new SwipeEvent("swipecancel", {reason: e.type})));
    }

    static complete(e, owner) {
      e.defaultAction = _ => {
        const startEvent = document.head.eventLoop.querySelector("#" + owner.getAttribute("::swipe-observe")).event;
        owner.removeAttribute("::swipe-observe");
        owner.removeAttribute("::swipe-active");
        startEvent.target.dispatchEvent(new SwipeEvent("swipe", {
          swipeDistX: e.x - startEvent.x,
          swipeDistY: e.y - startEvent.y
        }))
      };
    }

    destructor() {
      this.#owner.style.userSelect = this.#owner.style.setProperty("--userSelectDefault");
      this.#owner.style.removeProperty("--userSelectDefault");
    }
  };
}