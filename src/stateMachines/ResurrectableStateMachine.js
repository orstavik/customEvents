import {NodeStateMachine} from "./StateMachine.js";

const resurrectedMetaElements = new WeakSet();

export function PersistStateMachine(Base) {
  if (Base !== NodeStateMachine && !(Base.prototype instanceof NodeStateMachine))
    throw new Error("PersistStateMachine only accepts a Base that is a NodeStateMachine.");

  return class PersistentStateMachine extends Base {
    #meta;

    constructor(prefix, owner) {
      super(prefix, owner);
      if (!owner.isConnected)
        throw new Error("PersistentEventStateMachines can only be added to elements already connected to the DOM.");
      let uid;
      try {
        uid = this.uid;
      } catch (err) {
        throw new Error("PersistentEventStateMachines can only be added to elements with an id for all host nodes.");
      }
      this.#meta = document.head.querySelector(`:scope > meta-${prefix}[uid=${uid}]`);
      if (this.#meta) {
        if (resurrectedMetaElements.has(this.#meta))
          throw "Recovering meta element with the same type and uid as another state machine. Rapport this bug and it will be fixed.";
        resurrectedMetaElements.add(this.#meta);
        //todo this is too soon, the subclasses aren't setup. So, do we delay this in a prt??
        this.enterState(this.#meta.getAttribute("state"), this.#meta.innerText === "" ? undefined : JSON.parse(this.#meta.innerText));
      } else {
        this.#meta = document.createElement(`meta-${prefix}`);
        this.#meta.setAttribute("uid", uid);
        document.head.append(this.#meta);
      }
    }

    enterState(state, value) {
      super.enterState(state, value);
      this.#meta.setAttribute("state", state);
      this.#meta.innerText = JSON.stringify(value);
    }

    destructor() {
      super.destructor();
      this.#meta.remove();
    }
  }
}