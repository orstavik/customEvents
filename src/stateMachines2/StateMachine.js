//todo this is an HTMLElement method.
export function hostChain(el) {
  const res = [];
  for (; el; el = el.getRootNode()?.host)
    res.unshift(el);
  return res;
}

export class NodeStateMachine {
  #owner;
  #hosts;
  #stateValue;
  #state;

  constructor(owner) {
    this.#owner = owner;
    this.#hosts = hostChain(owner);
  }

  get prefix() {
    return this.constructor.prefix;
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
}