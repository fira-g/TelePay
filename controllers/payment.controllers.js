import axios from 'axios'
import { prisma } from '../config/db.js';
import {transitionPayment} from '../services/paymentStateMachine.js';
import { paymentStates } from '../services/paymentStates.js';
import { fakeProviderCharge } from '../services/fakeProvider.js';
const baseUrl = "http://localhost:3000";


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
            return res.json({
                paymentId: existingPayment.id,
                status: existingPayment.status,
                message : "Payment already exists"
            })
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

            return res.json({
        paymentId: existingPayment.id,
        status: existingPayment.status
      });
        }
        console.log(error)
        return res.status(500).json({message: "Internal server error"})
    }
};

export const mockProviderCallback = async (req, res) => {
    try {
        const {status, providerRef, paymentId} = req.body;
        if(!status || !providerRef || !paymentId){
            return res.status(400).json({message: "All fields are required"})
        }
        const payment = await prisma.payment.findUnique({where: {id: paymentId}});
        if(!payment){
            return res.status(404).json({message: "Payment not found"})
        }
        let nextState;
        try {
              nextState = transitionPayment(payment, status);
        } catch (error) {
            return res.status(400).json({message: error.message})
        }

        await prisma.payment.update({
            where: { id: paymentId },
            data: {
                status: nextState,
                providerRef
            }
        });
        return res.json({message: "Payment updated successfully"});
    } catch (error) {
        console.log(error)
        return res.status(500).json({message:"Internal server error"})
        
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

