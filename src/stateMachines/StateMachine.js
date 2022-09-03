export class NodeStateMachine {
  #owner;
  #hosts;
  #stateValue;
  #state;
  #uid;
  #prefix;

  constructor(owner, prefix) {
    this.#prefix = prefix;
    this.#owner = owner;
    this.#hosts = NodeStateMachine.hostChain(owner);
  }

  get prefix() {
    return this.#prefix;
  }

  get hosts() {
    return this.#hosts;
  }

  get owner() {
    return this.#owner;
  }

  get state() {
    return this.#state;
  }

  get stateValue() {
    return this.#stateValue;
  }

  get uid() {
    if (this.#uid)
      return this.#uid;
    const ids = this.#hosts.map(el => el.id);
    if (ids.every(el => el))
      return this.#uid = ids.join(" >> ");
    throw `A uid cannot be created for the given state machine: ${this.owner.tagName}`;
  }

  enterState(state, value) {
    this.#state = state;
    this.#stateValue = value;
  }

  leaveState() {
    this.#state = undefined;
    this.#stateValue = undefined;
  }

  destructor() {
    this.#state = undefined;
    this.#stateValue = undefined;
    //remember that super.destructor() calls should run in the reverse sequence of constructor calls.
    //ie.: build up processes (such as constructor and enterState) should run inside out (superclass before subclass)
    //     tear down processes (such as destructor and leaveState) should run outside in (subclass before superclass)
  }

  static hostChain(el) {
    const res = [];
    while (el) {
      res.unshift(el);
      el = el.getRootNode()?.host;
    }
    return res;
  }

  static protoInstanceOf(Base) {
    if (Base !== this && !(Base.prototype instanceof this))
      throw new TypeError(`${Base.name} is not a subclass of ${this.name}.`);
  }
}