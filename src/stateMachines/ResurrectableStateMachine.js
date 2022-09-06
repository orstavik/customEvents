import {NodeStateMachine} from "./StateMachine.js";

const resurrectedMetaElements = new WeakSet();

export function PersistStateMachine(Base) {
  NodeStateMachine.protoInstanceOf(Base);

  return class PersistentStateMachine extends Base {
    #meta;

    #verifyPersistability(){
      if (!this.owner.isConnected)
        throw new Error("PersistentEventStateMachines can only be added to elements already connected to the DOM.");
      try {
        this.uid;
      } catch (err) {
        //todo this might not be persistable if a shadowDom gives IDs dynamically during construction.
        // This will only work if IDs are assigned to elements in shadowDOM so that the same elements
        // get the same ID whenever it is reconstructed.
        throw new Error("PersistentEventStateMachines can only be added to elements with an id for all host nodes.");
      }
    }

    constructor(owner) {
      super(owner);
      this.#verifyPersistability();
      this.#meta = document.head.querySelector(`:scope > meta-${this.prefix}[uid=${this.uid}]`);
      if (this.#meta) {
        if (resurrectedMetaElements.has(this.#meta))
          throw "Recovering meta element with the same type and uid as another state machine. Rapport this bug and it will be fixed.";
        resurrectedMetaElements.add(this.#meta);
        //todo problem, superclass constructor calling method on this (running from subclasses), before the subclass constructor is created.
        this.enterState(this.#meta.getAttribute("state"), this.#meta.innerText === "" ? undefined : JSON.parse(this.#meta.innerText));
      } else {
        this.#meta = document.createElement(`meta-${this.prefix}`);
        this.#meta.setAttribute("uid", this.uid);
        document.head.append(this.#meta);
      }
    }

    enterState(state, value) {
      super.enterState(state, value);
      this.#meta.setAttribute("state", state);
      this.#meta.innerText = value === undefined ? "" : JSON.stringify(value);
    }

    destructor() {
      super.destructor();
      this.#meta.remove();
    }
  }
}