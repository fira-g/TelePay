import { transitions } from "./paymentTransitions.js";

export const transitionPayment = (payment, nextState) => {
  const currentState = payment.status;
  const allowedTransitions = transitions[currentState];

  if (!allowedTransitions) {
    throw new Error(`Invalid State : ${currentState}`);
  }

  if (!allowedTransitions.includes(nextState)) {
    throw new Error(`${nextState} is not a valid transition from ${currentState}`);
  }

  return nextState;
}