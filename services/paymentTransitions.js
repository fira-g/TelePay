import { paymentStates } from "./paymentStates.js";


export const transitions = {
  [paymentStates.INITIATED]: [
    paymentStates.AUTHORIZED,
    paymentStates.FAILED
  ],
  [paymentStates.AUTHORIZED]: [
    paymentStates.SETTLED,
    paymentStates.REFUND_PENDING
  ],
  [paymentStates.SETTLED]: [],
  [paymentStates.REFUND_PENDING]: [
    paymentStates.REFUNDED
  ],
  [paymentStates.REFUNDED]: [],
  [paymentStates.FAILED]: [],
};
