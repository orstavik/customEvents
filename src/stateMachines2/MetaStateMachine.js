import {hostChain, NodeStateMachine} from "./StateMachine.js";
import {StateHTMLMetaElement} from "./HTMLMetaElement_target.js";

export class MetaStateMachine extends NodeStateMachine {

  static getTargetUid(owner) {
    if (!owner.isConnected)
      throw new Error("PersistentEventStateMachines can only be added to elements already connected to the DOM.");
    try {
      const ids = hostChain(owner).map(el => el.id);
      if (ids.every(el => el))
        return ids.join(" >> ");
      throw `A uid cannot be created for the given state machine: ${owner.tagName}`;
    } catch (err) {
      //todo this might not be persistable if a shadowDom gives IDs dynamically during construction.
      // This will only work if IDs are assigned to elements in shadowDOM so that the same elements
      // get the same ID whenever it is reconstructed.
      throw new Error("PersistentEventStateMachines can only be added to elements with an id for all host nodes.");
    }
  }

  constructor(owner) {
    super(owner);
    const uid = MetaStateMachine.getTargetUid(owner);
    this.meta = StateHTMLMetaElement.singleton(this.prefix, uid);
    this.meta.machine = this;
    const {state, statevalue} = this.meta.state;
    if(state)
      this.enterState(state, statevalue);
     //todo problem, superclass constructor calling method on this (running from subclasses), before the subclass constructor is created.
     //todo cannot do it in the value of the meta, it must be in an attribute
  }

  enterState(state, value) {
    super.enterState(state, value);
    this.meta.setAttribute("state", state);
    value === undefined ?
      this.meta.removeAttribute("statevalue") :
      this.meta.setAttribute("statevalue", JSON.stringify(value));
  }

  destructor() {
    super.destructor();
    this.meta.remove();
  }
}