import { Worker } from "bullmq";
import { redis } from "../config/redis.js";
import { prisma } from "../config/db.js";
import { paymentStates } from "../services/paymentStates.js";
import { refundPayment } from "../services/refundService.js";
const worker = new Worker(
  "payment-queue",

  async (job) => {

    switch (job.name) {

      case "refund-payment": {

        const { paymentId } = job.data;

        console.log(
          `Processing refund for ${paymentId}`
        );

        const payment =
          await prisma.payment.findUnique({
            where: {
              id: paymentId
            }
          });

        if (!payment) {
          throw new Error(
            "Payment not found"
          );
        }

        const refundResult =
          await refundPayment(payment);

        if (
          refundResult ===
          "SUCCESS"
        ) {

          await prisma.payment.update({
            where: {
              id: paymentId
            },
            data: {
              status:
                paymentStates
                  .REFUNDED
            }
          });

          console.log(
            `Payment ${paymentId} refunded`
          );
        }

        break;
      }
    }
  },

  {
    connection: redis
  }
);

worker.on(
  "completed",
  (job) => {
    console.log(
      `Job ${job.id} completed`
    );
  }
);

worker.on(
  "failed",
  (job, err) => {
    console.log(
      `Job ${job?.id} failed:`,
      err.message
    );
  }
);