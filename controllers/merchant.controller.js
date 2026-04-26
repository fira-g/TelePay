import { prisma } from "../config/db.js";
import bcrypt from "bcrypt";
import crypto from "crypto";

const generateKey = async (merchantId) => {
  while (true) {
    try {
      const prefix = "telepay_" + crypto.randomBytes(8).toString("hex");
      const secret = crypto.randomBytes(32).toString("hex");
      const apiKey = prefix + "." + secret;
      const secretHash = await bcrypt.hash(secret, 10);
      const apiKeyEntry = await prisma.apiKey.create({
        data: { secretHash, prefix, merchantId },
      });
      return apiKey;
    } catch (error) {
      if (error.code === "P2002") continue;
      else throw error;
    }
  }
};
export const signup = async (req, res) => {
  try {
    const { email, name } = req.body;
    const existingUser = await prisma.merchant.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ message: "Merchant already exists" });
    const newMerchant = await prisma.merchant.create({
      data: { email, name },
    });

    const apiKey = await generateKey(newMerchant.id);
    return res.status(201).json({ apiKey: apiKey, merchantId:newMerchant.id });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: error.message });
  }
};

export const generateNewApiKey = async (req, res) => {
  try {
    const newApiKey = await generateKey(req.merchantId);
    res.status(201).json({ apiKey: newApiKey });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const validateApiKey = async (req, res, next) => {
  try {
    const apiKey = req.headers["x-api-key"];
    const {merchantId} = req.params;

    if (!apiKey) {
      return res.status(401).json({ message: "API key is required" });
    }
    const [prefix, secret] = apiKey.split(".");
    const keyRecord = await prisma.apiKey.findUnique({
      where: { prefix,merchantId },
    });
    if (!keyRecord || keyRecord.revoked)
      return res.status(403).json({ message: "Invalid API key" });
    const isSecretValid = await bcrypt.compare(secret, keyRecord.secretHash);
    if (!isSecretValid)
      return res.status(403).json({ message: "Invalid Secret" });
    req.merchantId = merchantId;
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};