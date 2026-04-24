import express from "express";
import {
  getPayment,
  initiatePayment,
  mockProviderCallback,
} from "../controllers/payment.controllers.js";

const routes = express.Router();

routes.post("/initiate/:merchantId", initiatePayment);
routes.post("/mock-provider-callback", mockProviderCallback);
routes.get("/:id", getPayment);

export default routes;
