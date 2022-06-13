export class TrippleClick {

  constructor(ownerElement) {
    this.owner = ownerElement;
    this.listener = this.onClick.bind(this);
    this.reset()
    this.owner.addEventListener("click", this.listener);
  }

  reset() {
    this.clicks = [];
  }

  onClick(e) {
    if (e.defaultAction || e.defaultPrevented)
      return this.reset();

    if (this.clicks.length === 2) {
      if ((e.timeStamp - this.clicks[0].timeStamp) < 600) {
        const trippleClick = new e.constructor("tripple-click", e);
        trippleClick.one = this.clicks[0];
        trippleClick.two = this.clicks[1];
        trippleClick.three = e;
        e.defaultAction = _=> this.owner.dispatchEvent(trippleClick);
        return this.reset();
      }
      this.clicks.shift();
    }
    this.clicks.push(e);
  }

  destructor() {
    this.owner.removeEventListener("click", this.listener);
  }
}