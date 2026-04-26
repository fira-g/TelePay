import dotenv from "dotenv";

dotenv.config();

const BASE_URL = process.env.BASE_URL;
const DB_URL = process.env.DATABASE_URL;
const PORT = process.env.PORT;

export { BASE_URL, DB_URL, PORT };