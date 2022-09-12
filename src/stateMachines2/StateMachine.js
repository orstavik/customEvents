export class NodeStateMachine {
  #stateValue;
  #state;
  #meta;

  constructor(meta) {
    this.#meta = meta;
    meta.reset = _ => this.reset(); //todo can be done in the event listener??
  }

  get prefix() {
    return this.constructor.prefix;
  }

  get meta(){
    return this.#meta;
  }

  get hosts() {
    return this.#meta.targets;
  }

  get owner() {
    return this.#meta.target;
  }

  get state() {
    return this.#state;
  }

  get stateValue() {
    return this.#stateValue;
  }

  enterState(state, value) {
    this.#state = state;
    this.#stateValue = value;
    this.#meta.setAttribute("state", state);
    value === undefined ?
      this.#meta.removeAttribute("statevalue") :
      this.#meta.setAttribute("statevalue", JSON.stringify(value));
  }

  leaveState() {
    this.#state = undefined;
    this.#stateValue = undefined;
  }

  reset() {
    //todo
  }

  destructor() {
    this.#state = undefined;
    this.#stateValue = undefined;
    //remember that super.destructor() calls should run in the reverse sequence of constructor calls.
    //ie.: build up processes (such as constructor and enterState) should run inside out (superclass before subclass)
    //     tear down processes (such as destructor and leaveState) should run outside in (subclass before superclass)
  }
}