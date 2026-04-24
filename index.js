import express from "express";
import dotenv from "dotenv";
import paymentRoutes from "./routes/payment.routes.js";

dotenv.config();

import merchantRoutes from "./routes/merchant.routes.js";

const app = express();

app.use(express.json());

app.use("/payments", paymentRoutes);
app.use("/merchant", merchantRoutes);
app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
