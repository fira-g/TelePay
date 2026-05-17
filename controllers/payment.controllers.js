import axios from 'axios'
import { prisma } from '../config/db.js';
import {transitionPayment} from '../services/paymentStateMachine.js';
import { paymentStates } from '../services/paymentStates.js';
import { fakeProviderCharge } from '../services/fakeProvider.js';
import { creditMerchant } from '../services/merchantServices.js';
import { refundPayment } from '../services/refundService.js';
import { redis } from '../config/redis.js';

export const initiatePayment = async (req, res) => {
    try {
        const {amount, currency} = req.body;
        const {merchantId} = req.params
        const idempotencyKey = req.headers["x-idempotency-key"]
        if(!amount || !currency || !merchantId){
            return res.status(400).json({message: "All fields are required"})
        }

        const merchant = await prisma.merchant.findUnique({where: {id: merchantId}});
        if(!merchant){
            return res.status(404).json({message: "Merchant not found"})
        }

        if(!idempotencyKey){
            return res.status(400).json({message: "Idempotency key is required"})
        }

        const redisKey = `idem:${merchantId}:${idempotencyKey}`
        const cachedPayement = await redis.get(redisKey);
        if(cachedPayement){
            console.log("Payment already exists - idempotencyKey detected")
            return res.json(JSON.parse(cachedPayement));
        }
        
        const existingPayment = await prisma.payment.findUnique({
            where:{
                merchantId_idempotencyKey:{
                    merchantId,
                    idempotencyKey
                }
            }
        })
        if(existingPayment){
            console.log("Payment already exists - idempotencyKey detected")
            const response = {
                paymentId: existingPayment.id,
                status: existingPayment.status,
                message : "Payment already exists"
            }
            await redis.set(
        redisKey,
        JSON.stringify(response),
        "EX",
        60 * 60 * 24 // 24 hours
    );
            return res.json(response)
        }

        

        const payment = await prisma.payment.create({
            data: {
                amount,
                currency,
                merchantId,
                status: paymentStates.INITIATED,
                idempotencyKey
            }
        });
        const response = {
            paymentId: payment.id,
            status: payment.status
        };

        await redis.set(
            redisKey,
            JSON.stringify(response),
            "EX",
            60 * 60 * 24
        );

res.json(response);

        console.log(payment)
        const  providerResponse = fakeProviderCharge(payment);
        if (providerResponse) {
            await prisma.payment.update({
            where: { id: payment.id },
            data: {
                providerRef: providerResponse.providerRef
                // status not updated
            }
            });
        }
        res.json({
            paymentId: payment.id,
            status: payment.status
        });
        
    } catch (error) {
        if(error.code === "P2002"){
            console.log("Race condition detected, fetching existing payment");

            const { merchantId } = req.params;
            const idempotencyKey = req.headers["x-idempotency-key"];

            const existingPayment = await prisma.payment.findUnique({
                where: {
                    merchantId_idempotencyKey: {
                        merchantId,
                        idempotencyKey
                    }
                }
            });

            const response = {
                paymentId: existingPayment.id,
                status: existingPayment.status
            };

            await redis.set(
                redisKey,
                JSON.stringify(response),
                "EX",
                60 * 60 * 24
            );

            return res.json(response);
        }
        console.log(error)
        return res.status(500).json({message: "Internal server error"})
    }
};


export const mockProviderCallback = async (req, res) => {
    try {
        const { status, providerRef, paymentId } = req.body;

        if (!status || !providerRef || !paymentId) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const payment = await prisma.payment.findUnique({
            where: { id: paymentId }
        });

        if (!payment) {
            return res.status(404).json({ message: "Payment not found" });
        }

        let nextState;
        try {
            nextState = transitionPayment(payment, status);
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }

        //update to AUTHORIZED(or FAILED)
        const updatedPayment = await prisma.payment.update({
            where: { id: paymentId },
            data: {
                status: nextState,
                providerRef
            }
        });

        // Only continue Saga if provider SUCCESS
        if (nextState === paymentStates.AUTHORIZED) {
            try {
                // try to credit merchant
                await creditMerchant(updatedPayment);

                // move to SETTLED
                await prisma.payment.update({
                    where: { id: paymentId },
                    data: {
                        status: paymentStates.SETTLED
                    }
                });

                console.log("Payment settled");

            } catch (err) {
                console.log("Merchant credit failed - triggering compensation");

                // move to REFUND_PENDING
                await prisma.payment.update({
                    where: { id: paymentId },
                    data: {
                        status: paymentStates.REFUND_PENDING
                    }
                });

                //compensate (refund)
                const refundResult = await refundPayment(updatedPayment);

                if (refundResult === "SUCCESS") {
                    await prisma.payment.update({
                        where: { id: paymentId },
                        data: {
                            status: paymentStates.REFUNDED
                        }
                    });

                    console.log("Payment refunded");
                }
            }
        }

        return res.json({ message: "Callback processed with saga" });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
export const getPayment = async (req, res) => {
    try {
        const {id} = req.params;
        if(!id){
            return res.status(400).json({message: "Payment ID is required"})
        }
        const payment = await prisma.payment.findUnique({where: {id}});
        if(!payment){
            return res.status(404).json({message: "Payment not found"})
        }
        res.json(payment);
    } catch (error) {
        return res.status(500).json({message: "Internal server error"})
    }
};

