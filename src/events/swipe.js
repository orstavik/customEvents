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
      const reset = _ => this.owner.removeAttribute("::swipe");
      this.mousedownInitialListener = this.onMousedownInitial.bind(this);
      this.mousemoveListener = this.onMousemove.bind(this);
      this.mouseupListener = this.onMouseUp.bind(this);

      this.userSelect = this.owner.style.userSelect;
      this.owner.style.userSelect = "none";
      this.mo = new MutationObserver(() => {
        if (this.owner.hasAttribute("::swipe")) {                    //todo can we get conflicts when we listen for such things on the window later??
          this.owner.removeEventListener("mousedown_1", this.mousedownInitialListener);
          window.addEventListener("mousedown", reset);
          window.addEventListener("mousemove", this.mousemoveListener);
          window.addEventListener("mousemove_outofbounds", reset);
          window.addEventListener("mouseup", this.mouseupListener);   //todo this mouseup and mousemove events should be on window now, right?
          window.addEventListener("blur", reset);
          window.addEventListener("selectstart", reset);
        } else {
          this.owner.addEventListener("mousedown_1", this.mousedownInitialListener);
          window.removeEventListener("mousedown", reset);
          window.removeEventListener("mousemove", this.mousemoveListener);
          window.removeEventListener("mousemove_outofbounds", reset);
          window.removeEventListener("mouseup", this.mouseupListener);
          window.removeEventListener("blur", reset);
          window.removeEventListener("selectstart", reset);
        }
      });
      this.mo.observe(this.owner, {attributeFilter: ["::swipe"]});
      if (!this.owner.hasAttribute("::swipe"))
        this.owner.addEventListener("mousedown_1", this.mousedownInitialListener);
    }

    reset() {
      this.owner.removeAttribute("::swipe");
    }

    //todo 1. add an attribute observer, so that the end state reacts from this attribute.
    //        That would enable us to test the application mid process.
    //        when the state attribute is set from the template, this thing will still work.

    onMousedownInitial(e) { //this shouldn't be a default action maybe, as the swipe is not passed the minDuration nor the minDistance
      e.defaultAction = _ => this.owner.setAttribute("::swipe", e.x + "," + e.y);        //todo use json here
    }

    onMousemove(e) {
      // this.sequence.push(e); //todo add this to the special attribute state??
    }

    onMouseUp(e) {
      //todo check for minDuration or maxDuration of the swipe here.
      const [swipeStartX, swipeStartY] = this.owner.getAttribute("::swipe").split(",").map(str => parseInt(str));
      let swipeDistX = swipeStartX - e.x;
      let swipeDistY = swipeStartY - e.y;
      if (Math.abs(swipeDistX) > Math.abs(swipeDistY) && Math.abs(swipeDistX) > minDistance || Math.abs(swipeDistY) > minDistance)
        e.defaultAction = _ => this.owner.dispatchEvent(new SwipeEvent("swipe", {swipeDistX, swipeDistY}));
      this.reset();
    }

    //adding mutation observer when this is added?
    //when the mutation observer registers that the thing is removed?
    //todo should we revert to pointer instead of mouse events? probably? why not?
    destructor() {
      this.reset();
      this.owner.removeEventListener("mousedown", this.mousedownInitialListener);
      this.owner.style.userSelect = this.userSelect;
      this.mo.disconnect();
    }
  };
}