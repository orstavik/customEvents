import {NodeStateMachine} from "./StateMachine.js";

export function ReflectStateMachine(Base) {
  if (!NodeStateMachine.isPrototypeOf(Base) && NodeStateMachine !== Base)
    throw new TypeError(`${Base.name} is not a subclass of NodeStateMachine.`);

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
  if (!NodeStateMachine.isPrototypeOf(Base))
    throw new TypeError(`${Base.name} is not a subclass of NodeStateMachine.`);

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

export function PseudoAttributesStateMachine(Base) {
  if (!NodeStateMachine.isPrototypeOf(Base))
    throw new TypeError(`${Base.name} is not a subclass of NodeStateMachine.`);

  return class PseudoHostStateMachine extends Base {

    //todo this can be done in a define callback instead.
    constructor(meta) {
      super(meta);
      if (!this.constructor.pseudoAttributes)
        throw "Subclasses of PseudoHostStateMachine must implement 'static get pseudoAttributes(){return [...]}'.";
    }

    enterState(state, value) {
      super.enterState(state, value);
      for (let pseudo of this.constructor.pseudoAttributes) {
        const type = `::${this.prefix}-${pseudo}`;
        for (let el of this.hosts)
          value?.[pseudo] === undefined ? el.removeAttribute(type) : el.setAttribute(type, value[pseudo]);
      }
    }

    destructor() {
      super.destructor();
      for (let pseudo of this.constructor.pseudoAttributes) {
        const type = `::${this.prefix}-${pseudo}`;
        for (let el of this.hosts)
          el.removeAttribute(type);
      }
    }
  }
}