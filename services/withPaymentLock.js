import { redis } from "../config/redis.js";

export const withPaymentLock = async (
  paymentId,
  callback
) => {
  const lockKey = `lock:payment:${paymentId}`;

  const acquired = await redis.set(
    lockKey,
    "locked",
    "NX",
    "EX",
    10
  );

  if (!acquired) {
    throw new Error(
      "Payment is already being processed"
    );
  }

  try {
    return await callback();
  } finally {
    await redis.del(lockKey);
  }
};