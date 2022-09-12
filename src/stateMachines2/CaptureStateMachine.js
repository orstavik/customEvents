import {MetaCaptureHTMLElement} from "./HTMLMetaElement_counter.js";
import {NodeStateMachine} from "./StateMachine.js";

const captureKeyGenerator = MetaCaptureHTMLElement.singleton("capture");

export function CaptureStateMachine(NodeStateMachineClass) {
  if (!NodeStateMachine.isPrototypeOf(NodeStateMachineClass) && NodeStateMachine !== NodeStateMachineClass)
    throw new TypeError(`${NodeStateMachineClass.name} is not a subclass of MetaStateMachine.`);

  return class CaptureStateMachine extends NodeStateMachineClass {
    observe(event) {
      const metaId = captureKeyGenerator.getCaptureKey(event);
      this.meta.setAttribute("capture", (this.meta.getAttribute("capture")?? "") + (" " + metaId))
    }

    capture() {
      for (let key of this.meta.getAttribute("capture").split(" "))
        for (let metaMachine of document.head.querySelectorAll(`:scope > meta[capture~="${key}"]`))
          metaMachine !== this.meta && metaMachine.reset();
    }
  }
}