import { paymentQueue } from "../queues/refundQueue.js";

export const queueRefundJob =
async (paymentId) => {

  await paymentQueue.add(
    "refund-payment",

    {
      paymentId
    },

    {
      attempts: 5,

      backoff: {
        type: "exponential",
        delay: 3000
      }
    }
  );

  console.log(
    `Refund job queued for ${paymentId}`
  );
};