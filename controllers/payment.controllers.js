import axios from 'axios'
import { prisma } from '../config/db.js';
const baseUrl = "http://localhost:3000";

function fakeProviderCharge(payment) {
  const outcome = Math.random();

  let status;
  if (outcome < 0.4) status = "SUCCESS";
  else if (outcome < 0.7) status = "FAILED";
  else status = "TIMEOUT";

  const providerRef = "tx_" + Math.floor(Math.random() * 100000);

  setTimeout(async () => {
    try {
      await axios.post(`${baseUrl}/payments/mock-provider-callback`, {
        paymentId: payment.id,
        status: status === "TIMEOUT" ? "SUCCESS" : status,
        providerRef
      });
      console.log("Callback sent:", payment.id, status);
    } catch (err) {
      console.log("Callback failed");
    }
  }, Math.random() * 5000);

    if (status === "TIMEOUT") {
        return null;
    }

    return {
        status,
        providerRef
    };
    }


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
                status: "PENDING",
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
        if(error.code == "P2002"){
            console.log("⚠️ Race condition detected, fetching existing payment");

      const { merchantId } = req.body;
      const idempotencyKey = req.headers["idempotency-key"];

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
        return res.status(500).json({message: "Internal server error"})
        console.log(error)
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
        if(payment.status == "  SUCCESS" || payment.status == "FAILED"){
            return res.status(400).json({message: "Payment already processed"})
        }
        if(payment.status =="PENDING" && (status == "SUCCESS" || status == "FAILED")  ){
            await prisma.payment.update({
                where: { id: paymentId },
                data: {
                    status: status === "SUCCESS" ? "SUCCESS" : "FAILED",
                    providerRef
            }
        });
        return res.json({message: "Payment updated successfully"});
    }
    return res.status(400).json({message:"Invalid transition"})
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

