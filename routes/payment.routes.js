import express from "express";
import {
  getPayment,
  initiatePayment,
  mockProviderCallback,
  testQueue,
} from "../controllers/payment.controllers.js";
import { validateApiKey } from "../controllers/merchant.controller.js";

const routes = express.Router();

routes.post("/initiate/:merchantId", validateApiKey, initiatePayment);
routes.post("/mock-provider-callback", mockProviderCallback);
routes.get("/:merchantId/:id", validateApiKey, getPayment);
routes.get("/test",testQueue)

export default routes;
