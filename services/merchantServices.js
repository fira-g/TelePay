
export const creditMerchant = async (payment) => {
    const random = Math.random();

    // simulate failure
    if (random < 0.5) {
        throw new Error("Merchant service failed");
    }

    console.log("Merchant credited:", payment.merchantId);

    return true;
};