import dotenv from "dotenv";
dotenv.config({ path: "../.env" });

import express from "express";
import cors from "cors";
import { config } from "./config.js";
import authRoutes from "./routes/auth.js";
import paymentRoutes from "./routes/payments.js";
import reportRoutes from "./routes/reports.js";
import mapRoutes from "./routes/maps.js";
import emailRoutes from "./routes/emails.js";
import contactRoutes from "./routes/contact.js";
import apartmentRoutes from "./routes/apartments.js";
import viewingRequestRoutes from "./routes/viewingRequests.js";
import bookingRequestRoutes from "./routes/bookingRequests.js";
import reviewRoutes from "./routes/reviews.js";
import { startCronJobs } from "./cron/cleanup.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: ["http://localhost:5174", "http://localhost:5173"] }));
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Sakani API is running", version: "1.0.0" });
});

app.use("/api/auth", authRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/maps", mapRoutes);
app.use("/api/emails", emailRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/apartments", apartmentRoutes);
app.use("/api/viewing-requests", viewingRequestRoutes);
app.use("/api/booking-requests", bookingRequestRoutes);
app.use("/api/reviews", reviewRoutes);

app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Sakani server running on port ${PORT}`);
  console.log(`Paymob mode: ${config.paymobMode.toUpperCase()}`);
  console.log(`Paymob Secret Key: ${config.paymobSecretKey ? "CONFIGURED" : "NOT SET"}`);
  console.log(`Paymob Public Key: ${config.paymobPublicKey ? "CONFIGURED" : "NOT SET"}`);
  console.log(`Paymob Integration ID: ${config.paymobIntegrationId || "NOT SET"}`);
  console.log(`Paymob HMAC secret: ${config.paymobHmacSecret ? "CONFIGURED" : "NOT SET"}`);
  startCronJobs();
});
