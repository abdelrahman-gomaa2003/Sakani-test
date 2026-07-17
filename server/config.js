import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: "../.env" });

const paymobMode = (process.env.PAYMOB_MODE || "sandbox").toLowerCase();

function resolvePaymobSecretKey() {
  if (process.env.PAYMOB_SECRET_KEY) return process.env.PAYMOB_SECRET_KEY;
  return paymobMode === "live"
    ? process.env.PAYMOB_SECRET_KEY_LIVE || ""
    : process.env.PAYMOB_SECRET_KEY_SANDBOX || "";
}

function resolvePaymobPublicKey() {
  if (process.env.PAYMOB_PUBLIC_KEY) return process.env.PAYMOB_PUBLIC_KEY;
  return paymobMode === "live"
    ? process.env.PAYMOB_PUBLIC_KEY_LIVE || ""
    : process.env.PAYMOB_PUBLIC_KEY_SANDBOX || "";
}

function resolvePaymobIntegrationId() {
  if (process.env.PAYMOB_INTEGRATION_ID) return process.env.PAYMOB_INTEGRATION_ID;
  return paymobMode === "live"
    ? process.env.PAYMOB_INTEGRATION_ID_LIVE || ""
    : process.env.PAYMOB_INTEGRATION_ID_SANDBOX || "";
}

function resolvePaymobHmacSecret() {
  if (process.env.PAYMOB_HMAC_SECRET) return process.env.PAYMOB_HMAC_SECRET;
  return paymobMode === "live"
    ? process.env.PAYMOB_HMAC_SECRET_LIVE || ""
    : process.env.PAYMOB_HMAC_SECRET_SANDBOX || "";
}

export const config = {
  supabaseUrl: process.env.VITE_SUPABASE_URL,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY,
  resendApiKey: process.env.RESEND_API_KEY || "",
  paymobMode,
  paymobSecretKey: resolvePaymobSecretKey(),
  paymobPublicKey: resolvePaymobPublicKey(),
  paymobIntegrationId: resolvePaymobIntegrationId(),
  paymobHmacSecret: resolvePaymobHmacSecret(),
  googleMapsKey: process.env.GOOGLE_MAPS_API_KEY || "",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5174",
};

export const supabaseAdmin = createClient(config.supabaseUrl, config.supabaseServiceKey);
