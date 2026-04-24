import express from "express";
import {
  generateNewApiKey,
  signup,
} from "../controllers/merchant.controller.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/new/:merchantId", generateNewApiKey);

export default router;
