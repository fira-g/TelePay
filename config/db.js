import dotenv from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import pkg from "@prisma/client";

dotenv.config();
const { PrismaClient } = pkg;

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
export const prisma = new PrismaClient({ adapter });
