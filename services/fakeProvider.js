import axios from "axios";
import { BASE_URL } from "../config/env.js";


function fakeProviderCharge(payment) {
  const providerRef = "tx_" + Math.floor(Math.random() * 100000);
  const outcome = Math.random();

  // 70% success flow, 30% fail
  const isSuccess = outcome < 0.7;

  if (!isSuccess) {
    // FAILURE FLOW
    setTimeout(async () => {
      await sendCallback(payment.id, "FAILED", providerRef);
    }, randomDelay());

    return { providerRef };
  }

  // SUCCESS FLOW

  // Step 1: AUTHORIZED
  setTimeout(async () => {
    await sendCallback(payment.id, "AUTHORIZED", providerRef);

    // simulate duplicate AUTHORIZED (20% chance)
    if (Math.random() < 0.2) {
      await sendCallback(payment.id, "AUTHORIZED", providerRef);
    }

  }, randomDelay());

  // Step 2: SETTLED (delayed)
  setTimeout(async () => {
    await sendCallback(payment.id, "SETTLED", providerRef);

    // simulate duplicate SETTLED
    if (Math.random() < 0.2) {
      await sendCallback(payment.id, "SETTLED", providerRef);
    }

  }, randomDelay(3000, 7000));

  return { providerRef };
}

async function sendCallback(paymentId, status, providerRef) {
  try {
    await axios.post(`${baseUrl}/payments/mock-provider-callback`, {
      paymentId,
      status,
      providerRef
    });

    console.log("Callback sent:", paymentId, status);
  } catch (err) {
    console.log("Callback failed:", status);
  }
}

function randomDelay(min = 500, max = 3000) {
  return Math.floor(Math.random() * (max - min)) + min;
}

export { fakeProviderCharge };
