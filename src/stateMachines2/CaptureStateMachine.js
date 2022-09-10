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
          metaMachine !== this.meta && metaMachine.machine.reset();
    }
  }
}
//
// //todo the below code is for transient usages, not good architecture, feels bad sometimes, don't remember why.
// const keysToStateMachines = new WeakMap();
// const stateMachineToKeys = new WeakMap();
//
// function* machineToCapturedMachines(m) {
//   for (let key of stateMachineToKeys.get(m))
//     for (let machine of keysToStateMachines.get(key))
//       if (machine !== m)
//         yield machine;
// }
//
// function addKeyForMachine(machine, event) {
//   const keys = stateMachineToKeys.get(machine);
//   keys ? keys.push(event) : stateMachineToKeys.set(machine, [event]);
//   const machines = keysToStateMachines.get(event);
//   machines ? machines.push(machine) : keysToStateMachines.set(event, [machine]);
// }
//
// export function CaptureJS(NodeStateMachineClass) {
//   if (!NodeStateMachine.isPrototypeOf(NodeStateMachineClass))
//     throw new TypeError(`${NodeStateMachineClass.name} is not a subclass of MetaStateMachine.`);
//   return class CaptureStateMachine extends NodeStateMachine {
//     observe(event) {
//       addKeyForMachine(this, event);
//     }
//
//     capture() {
//       for (let other of machineToCapturedMachines(this))
//         other.reset();
//     }
//   };
// }