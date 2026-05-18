import { Queue } from "bullmq";
import { redis } from "../config/redis.js";

export const paymentQueue = new Queue(
  "payment-queue",
  {
    connection: redis,
  }
);