import {NodeStateMachine} from "./StateMachine.js";

export function ReflectStateMachine(Base) {
  if (Base !== NodeStateMachine && !(Base.prototype instanceof NodeStateMachine))
    throw new Error("ReflectHostsStateMachine only accepts a Base that is a NodeStateMachine.");

  return class ReflectStateMachine extends Base {
    enterState(state, value) {
      super.enterState(state, value);
      this.owner.setAttribute("::" + this.prefix, state);
    }

    destructor() {
      super.destructor();
      this.owner.removeAttribute("::" + this.prefix);
    }
  }
}

export function ReflectHostsStateMachine(Base) {
  if (Base !== NodeStateMachine && !(Base.prototype instanceof NodeStateMachine))
    throw new Error("ReflectHostsStateMachine only accepts a Base that is a NodeStateMachine.");

  return class ReflectHostsStateMachine extends Base {
    enterState(state, value) {
      super.enterState(state, value);
      for (let el of this.hosts)
        el.setAttribute("::" + this.prefix, state);
    }

    destructor() {
      super.destructor();
      for (let el of this.hosts)
        el.removeAttribute("::" + this.prefix);
    }
  }
}

function toggleAttribute(el, type, value) {
  value === undefined ? el.removeAttribute(type) : el.setAttribute(type, value);
}

export function PseudoAttributesStateMachine(Base) {
  if (Base !== NodeStateMachine && !(Base.prototype instanceof NodeStateMachine))
    throw new Error("PseudoHostStateMachine only accepts a Base that is a NodeStateMachine.");

  return class PseudoHostStateMachine extends Base {
    #pseudoPrefix;

    constructor(owner, prefix) {
      super(owner, prefix);
      if (!this.constructor.pseudoAttributes)
        throw "There is no point in having a PseudoHostStateMachine if the final implementation doesn't have any pseudoAttributes";
      this.#pseudoPrefix = "::" + prefix + "-";
    }

    enterState(state, value) {
      super.enterState(state, value);
      for (let pseudo of this.constructor.pseudoAttributes) {
        const type = this.#pseudoPrefix + pseudo;
        for (let el of this.hosts)
          value?.[pseudo] === undefined ? el.removeAttribute(type) : el.setAttribute(type, value[pseudo]);
      }
    }

    destructor() {
      super.destructor();
      for (let pseudo of this.constructor.pseudoAttributes) {
        const type = this.#pseudoPrefix + pseudo;
        for (let el of this.hosts)
          el.removeAttribute(type);
      }
    }
  }
}