import { transitions } from "./paymentTransitions.js";

export const transitionPayment = (payment, nextState) => {
  const currentState = payment.status;
  const allowedTransitions = transitions[currentState];

  if (!allowedTransitions) {
    throw new Error("Invalid State");
  }

  if (!allowedTransitions.includes(nextState)) {
    throw new Error("Invalid Transition");
  }

  return nextState;
}