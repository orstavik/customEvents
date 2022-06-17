export class TrippleClick {

  constructor(ownerElement) {
    this.owner = ownerElement;
    this.listener = this.onClick.bind(this);
    this.reset();
    this.owner.addEventListener("click", this.listener);
    this.userSelect = this.owner.style.userSelect;
    this.owner.style.userSelect = "none";
  }

  reset() {
    this.clicks = [];
    this.#updateState();
  }

  #updateState() {
    this.owner.setAttribute("_tripple-click", this.clicks.length);
  }

  onClick(e) {
    if (e.defaultAction || e.defaultPrevented)
      return this.reset();

    if (this.clicks.length === 2) {
      const trippleClick = new e.constructor("tripple-click", e);
      trippleClick.clicks = [...this.clicks, e];
      e.defaultAction = _ => this.owner.dispatchEvent(trippleClick);
      return this.reset();
    }
    this.clicks.push(e);
    setTimeout(_ => {
      const pos = this.clicks.indexOf(e);
      pos >= 0 && this.clicks.splice(pos, 1);
      this.#updateState();
    }, 600);
    this.#updateState();
  }

  destructor() {
    this.owner.style.userSelect = this.userSelect;
    this.owner.removeEventListener("click", this.listener);
  }
}