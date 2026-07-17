import { supabase } from "../lib/supabase";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

async function apiCall(path, options = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || "Request failed");
  }

  const contentType = res.headers.get("content-type");
  if (contentType?.includes("application/pdf")) {
    return res.blob();
  }

  return res.json();
}

export const serverAPI = {
  register: (data) => apiCall("/api/auth/register", { method: "POST", body: JSON.stringify(data) }),
  approveApartment: (data) => apiCall("/api/auth/approve-apartment", { method: "POST", body: JSON.stringify(data) }),
  getAdminUsers: () => apiCall("/api/auth/users"),
  getAdminStats: () => apiCall("/api/auth/stats"),

  getPaymentPlans: () => apiCall("/api/payments/plans"),
  createCheckout: (data) => apiCall("/api/payments/checkout", { method: "POST", body: JSON.stringify(data) }),
  createSubscriptionCheckout: (data) => apiCall("/api/payments/subscription-checkout", { method: "POST", body: JSON.stringify(data) }),
  getPaymentHistory: () => apiCall("/api/payments/history"),

  getAdminReport: () => apiCall("/api/reports/admin"),
  getOwnerReport: () => apiCall("/api/reports/owner"),
  getRentalContract: (apartmentId, tenantId) => apiCall(`/api/reports/contract/${apartmentId}/${tenantId}`),

  approveVerification: (data) => apiCall("/api/auth/approve-verification", { method: "POST", body: JSON.stringify(data) }),

  geocodeAddress: (address) => apiCall("/api/maps/geocode", { method: "POST", body: JSON.stringify({ address }) }),
  reverseGeocode: (lat, lng) => apiCall("/api/maps/reverse-geocode", { method: "POST", body: JSON.stringify({ lat, lng }) }),
  findNearby: (lat, lng, type, radius) => apiCall("/api/maps/nearby", { method: "POST", body: JSON.stringify({ lat, lng, type, radius }) }),

  sendEmail: (data) => apiCall("/api/emails/send", { method: "POST", body: JSON.stringify(data) }),
  sendBulkEmails: (data) => apiCall("/api/emails/bulk", { method: "POST", body: JSON.stringify(data) }),
  sendMessageNotification: (data) => apiCall("/api/emails/send-message-notification", { method: "POST", body: JSON.stringify(data) }),

  getContactMessages: (params) => apiCall(`/api/contact?${new URLSearchParams(params)}`),
  updateContactMessage: (id, data) => apiCall(`/api/contact/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteContactMessage: (id) => apiCall(`/api/contact/${id}`, { method: "DELETE" }),
};
