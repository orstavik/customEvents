import {MetaStateMachine} from "./MetaStateMachine.js";

let captureCounter = 1;
const captureObjToNumber = new WeakMap();

function makeOrReuseCaptureKey(obj) {
  const oldId = captureObjToNumber.get(obj);
  if (oldId)
    return oldId;
  captureObjToNumber.set(obj, captureCounter++);
  return captureCounter;
}

export function CaptureStateMachine(MetaStateMachineClass) {
  if (!MetaStateMachine.isPrototypeOf(MetaStateMachineClass))
    throw new TypeError(`${MetaStateMachineClass.name} is not a subclass of MetaStateMachine.`);

  return class CaptureStateMachine extends MetaStateMachineClass {
    observe(event) {
      const metaId = makeOrReuseCaptureKey(event);
      //todo test with missing capture and having capture
      this.meta.setAttribute("capture", this.meta.getAttribute("capture")?.concat(" " + metaId) || metaId);
    }

    capture() {
      //if the key is in the captureObjToMachines, then we just use that one
      //if the key is not in the captureObjToMachines, then we go to the fallback, which is the
      for (let key of this.meta.getAttribute("capture").split(" "))
        for (let machine of document.head.querySelectorAll(`:scope > meta[capture~="${key}"]`))
          machine !== this.owner && machine.reset();
    }
  }
}