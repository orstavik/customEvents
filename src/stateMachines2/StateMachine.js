//remember that super.destructor() calls should run in the reverse sequence of constructor calls.
//ie.: build up processes (such as constructor and enterState) runs inside out (superclass before subclass)
//     tear down processes (such as destructor and leaveState) runs outside in (subclass before superclass)
export class NodeStateMachine {
  #meta;

  constructor(meta) {
    this.#meta = meta;
    Object.defineProperty(meta, "reset", {
      value: function () {
        const {state, value} = this.constructor.defaultState();
        return this.enterState(state, value);
      }.bind(this)
    });
  }

  get prefix() {
    return this.constructor.prefix;
  }

  get meta() {
    return this.#meta;
  }

  get hosts() {
    return this.#meta.targets;
  }

  get owner() {
    return this.#meta.target;
  }

  get state() {
    return this.#meta.state;
  }

  get stateValue() {
    return this.#meta.value;
  }

  enterState(state, value) {
    if (state === undefined)
      throw new Error("A statemachine cannot enter an undefined state");
    this.#meta.state = state;
    this.#meta.value = value;
  }

  leaveState() {
  }

  destructor() {
  }
}