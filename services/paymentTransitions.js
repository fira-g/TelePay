import { paymentStates } from "./paymentStates.js";


export const transitions = {
  [paymentStates.INITIATED]: [
    paymentStates.AUTHORIZED,
    paymentStates.FAILED
  ],
  [paymentStates.AUTHORIZED]: [
    paymentStates.SETTLED,
    paymentStates.FAILED
  ],
  [paymentStates.SETTLED]: [
    paymentStates.REFUND_PENDING
  ],
  [paymentStates.REFUND_PENDING]: [
    paymentStates.REFUNDED,
    paymentStates.FAILED
  ],
  [paymentStates.REFUNDED]: [],
  [paymentStates.FAILED]: [],
};
