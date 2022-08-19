function mouseOutOfBounds(trigger) {
  return trigger.clientY < 0 || trigger.clientX < 0 || trigger.clientX > window.innerWidth || trigger.clientY > window.innerHeight;
}

class SwipeEvent extends PointerEvent {
  #options;

  constructor(type, options) {
    super(type, {bubbles: true, composed: true});
    this.#options = options;
  }

  get direction() {
    const direction = this.#options.swipeDistY > 0 ? "top" : "down";
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

export function createSwipe({minDuration = 50, minDistance = 50, direction} = {}) {
  return class Swipe {
    constructor(ownerElement) {
      this.owner = ownerElement;
      this.mousedownInitialListener = this.onMousedownInitial.bind(this);
      this.mousedownSecondaryListener = this.onMousedownSecondary.bind(this);
      this.mousemoveListener = this.onMousemove.bind(this);
      this.mouseupListener = this.onMouseUp.bind(this);
      this.onBlurListener = this.reset.bind(this);
      this.onSelectstartListener = this.reset.bind(this);

      this.sequence = [];
      this.owner.addEventListener("mousedown", this.mousedownInitialListener);
      this.userSelect = this.owner.style.userSelect;
      this.owner.style.userSelect = "none";
    }

    reset() {
      this.sequence = [];
      this.stopSequence();
    }

    #updateState(e) {
      this.sequence.push(e)
      // this.owner.setAttributeNode(document.createAttribute("_swipe-" + name)); // SOME STATE IN the DOM
    }

    onMousedownInitial(e) {
      if (e.defaultAction || e.defaultPrevented || e.button !== 0)
        return this.reset();
      this.#updateState(e);
      this.startSequence();
    }

    onMousedownSecondary(e) {
      this.reset();
    }

    onMousemove(e) {
      if (mouseOutOfBounds(e)) this.reset();
      this.#updateState(e);
    }

    onMouseUp(e) {
      //todo check for minDuration or maxDuration of the swipe here.

      let swipeStartX = this.sequence[0].x - this.owner.offsetLeft;
      let swipeStartY = this.sequence[0].y - this.owner.offsetTop;
      let swipeDistX = swipeStartX - e.x;
      let swipeDistY = swipeStartY - e.y;
      if (!(Math.abs(swipeDistX) > Math.abs(swipeDistY) && Math.abs(swipeDistX) > minDistance || Math.abs(swipeDistY) > minDistance))
        return;
      e.defaultAction = _ => this.owner.dispatchEvent(new SwipeEvent("swipe", {swipeDistX, swipeDistY}));
      this.reset();
    }


    startSequence() {
      this.owner.removeEventListener("mousedown", this.mousedownInitialListener);
      this.owner.addEventListener("mousedown", this.mousedownSecondaryListener);
      this.owner.addEventListener("mousemove", this.mousemoveListener);
      this.owner.addEventListener("mouseup", this.mouseupListener);
      this.owner.addEventListener("blur", this.onBlurListener);
      this.owner.addEventListener("selectstart", this.onSelectstartListener);
    }

    //todo should we revert to pointer instead of mouse events? probably? why not?
    stopSequence() {
      this.owner.addEventListener("mousedown", this.mousedownInitialListener);
      this.owner.removeEventListener("mousedown", this.mousedownSecondaryListener);
      this.owner.removeEventListener("mousemove", this.mousemoveListener);
      this.owner.removeEventListener("mouseup", this.mouseupListener);
      this.owner.removeEventListener("blur", this.onBlurListener);
      this.owner.removeEventListener("selectstart", this.onSelectstartListener);
    }

    destructor() {
      this.owner.style.userSelect = this.userSelect;
      //todo: use this instead of .stopSequence()
      debugger
      // this.owner.addEventListener("mousedown", this.listener);
    }
  };
}