//todo this is an HTMLElement method.
function hostChain(el) {
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

  constructor(owner, meta) {
    this.#owner = owner;
    this.#hosts = hostChain(owner);
    this.meta = meta;
    meta.reset = _=>this.reset();
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
    this.meta.setAttribute("state", state);
    value === undefined ?
      this.meta.removeAttribute("statevalue") :
      this.meta.setAttribute("statevalue", JSON.stringify(value));
  }

  leaveState() {
    this.#state = undefined;
    this.#stateValue = undefined;
  }

  reset(){
    //todo
  }

  destructor() {
    this.#state = undefined;
    this.#stateValue = undefined;
    this.meta.remove();
    //remember that super.destructor() calls should run in the reverse sequence of constructor calls.
    //ie.: build up processes (such as constructor and enterState) should run inside out (superclass before subclass)
    //     tear down processes (such as destructor and leaveState) should run outside in (subclass before superclass)
  }
}