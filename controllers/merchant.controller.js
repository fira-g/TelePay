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
    if (existingUser)
      res.status(400).json({ message: "Merchant already exists" });
    const newMerchant = await prisma.merchant.create({
      data: { email, name },
    });

    const apiKey = await generateKey(newMerchant.id);
    res.status(201).json({ apiKey: apiKey, merchantId:newMerchant.id });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

export const generateNewApiKey = async (req, res) => {
  try {
    const { merchantId } = req.params;
    const oldApiKey = req.headers["x-api-key"];

    if (!oldApiKey) {
      return res.status(401).json({ message: "API key is required" });
    }
    const [prefix, secret] = oldApiKey.split(".");
    const keyRecord = await prisma.apiKey.findUnique({
      where: { prefix },
    });
    console.log(keyRecord);
    if (!keyRecord || keyRecord.revoked)
      return res.status(403).json({ message: "Invalid API key" });

    const isSecretValid = await bcrypt.compare(secret, keyRecord.secretHash);
    if (!isSecretValid)
      return res.status(403).json({ message: "Invalid Secret" });
    const revokedKey = await prisma.apiKey.update({
      where: { id: keyRecord.id },
      data: {
        revoked: true,
      },
    });
    const newApiKey = await generateKey(merchantId);
    res.status(201).json({ apiKey: newApiKey });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
