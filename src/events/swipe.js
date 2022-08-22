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

export function createSwipe({minDuration = 350, minDistance = 50, direction} = {}) {
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
          window.addEventListener("mousemove_outofbounds", reset);              //todo this is triggered, because there is no size of the window??
          window.addEventListener("mouseup", this.mouseupListener);
          window.addEventListener("blur", reset);
          window.addEventListener("selectstart", reset);           //todo the selectstart should be on the element, right?
        } else {
          this.owner.addEventListener("mousedown_1", this.mousedownInitialListener);
          window.removeEventListener("mousedown", reset);
          window.removeEventListener("mousemove", this.mousemoveListener);
          window.removeEventListener("mousemove_outofbounds", reset);
          window.removeEventListener("mouseup", this.mouseupListener);
          window.removeEventListener("blur", reset);
          window.removeEventListener("selectstart", reset);       //todo the selectstart should be on the element, right?
        }
      });
      this.mo.observe(this.owner, {attributeFilter: ["::swipe"]});
      if (!this.owner.hasAttribute("::swipe"))
        this.owner.addEventListener("mousedown_1", this.mousedownInitialListener);
    }

    reset() {
      this.owner.removeAttribute("::swipe");
    }

    onMousedownInitial(e) { //this shouldn't be a default action maybe, as the swipe is not passed the minDuration nor the minDistance
      e.defaultAction = _ => this.owner.setAttribute("::swipe", JSON.stringify([[e.x, e.y, e.timeStamp]]));
      //todo wait with setting the defaultAction here.
      //todo check the minDuration here0 using a setTimeout?? no probably not.

      //1. we need to keep a record of the start event, because we need to call and check for preventDefault on it.
      //2. in the onMousemove method, we need to check for minDuration and minDistance all the time, and that no one else calls preventDefaultAction on the start event.
      //3. if the mousemove method finds that all is completed to make the swipe actionable, then it should trigger the third phase.
      //   It is only in the third phase the the onMouseup will actually deliver a swipe event.
      //   If mouseup is done before this point, then the mouseup will be a reset.

      //* all this should be done in the MutationObserver, based on different content in the ::swipe setting.
    }

    onMousemove(e) {
      //todo check the minDuration and minDistance here??
      //when the swipe has passed the minDuration and the minDistance, then we should update the state again actually.
      // this.sequence.push(e); //todo add this to the special attribute state??
    }

    onMouseUp(e) {
      const [swipeStartX, swipeStartY, swipeStartTime] = JSON.parse(this.owner.getAttribute("::swipe"))[0];
      let swipeDistX = e.x - swipeStartX;
      let swipeDistY = e.y - swipeStartY;
      let duration = e.timeStamp - swipeStartTime;
      if (duration > minDuration && (Math.abs(swipeDistX) > Math.abs(swipeDistY) && Math.abs(swipeDistX) > minDistance || Math.abs(swipeDistY) > minDistance))
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