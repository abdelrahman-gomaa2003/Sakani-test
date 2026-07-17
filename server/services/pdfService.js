import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { supabaseAdmin } from "../config.js";

export async function generateAdminReport() {
  const [users, apartments, reviews, payments] = await Promise.all([
    supabaseAdmin.from("profiles").select("role, created_at"),
    supabaseAdmin.from("apartments").select("status, price, apartment_type, created_at"),
    supabaseAdmin.from("reviews").select("rating"),
    supabaseAdmin.from("payments").select("status, amount"),
  ]);

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const page = pdfDoc.addPage([595, 842]);

  let y = 800;

  page.drawText("Sakani Platform Report", { x: 50, y, size: 24, font: boldFont, color: rgb(0.18, 0.42, 0.31) });
  y -= 40;
  page.drawText(`Generated: ${new Date().toLocaleDateString("en-US")}`, { x: 50, y, size: 10, font, color: rgb(0.5, 0.5, 0.5) });
  y -= 50;

  const totalUsers = users.data?.length || 0;
  const totalApartments = apartments.data?.length || 0;
  const approvedApartments = apartments.data?.filter((a) => a.status === "approved").length || 0;
  const pendingApartments = apartments.data?.filter((a) => a.status === "pending").length || 0;
  const rejectedApartments = apartments.data?.filter((a) => a.status === "rejected").length || 0;
  const avgRating = reviews.data?.length ? (reviews.data.reduce((s, r) => s + r.rating, 0) / reviews.data.length).toFixed(1) : "N/A";

  const stats = [
    ["Total Users", String(totalUsers)],
    ["Total Apartments", String(totalApartments)],
    ["Approved", String(approvedApartments)],
    ["Pending", String(pendingApartments)],
    ["Rejected", String(rejectedApartments)],
    ["Average Rating", avgRating],
  ];

  page.drawText("Overview", { x: 50, y, size: 16, font: boldFont, color: rgb(0.18, 0.42, 0.31) });
  y -= 30;

  for (const [label, value] of stats) {
    page.drawText(`${label}:`, { x: 70, y, size: 12, font: boldFont });
    page.drawText(value, { x: 250, y, size: 12, font });
    y -= 25;
  }

  y -= 20;
  page.drawText("Apartments by Type", { x: 50, y, size: 16, font: boldFont, color: rgb(0.18, 0.42, 0.31) });
  y -= 30;

  const types = ["apartment", "studio", "room", "shared"];
  for (const t of types) {
    const count = apartments.data?.filter((a) => a.apartment_type === t).length || 0;
    page.drawText(`${t}: ${count}`, { x: 70, y, size: 12, font });
    y -= 25;
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

export async function generateOwnerReport(ownerId) {
  const { data: apartments } = await supabaseAdmin
    .from("apartments")
    .select("title, status, price, views, created_at")
    .eq("owner_id", ownerId);

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("full_name")
    .eq("id", ownerId)
    .single();

  const { data: reviews } = await supabaseAdmin
    .from("reviews")
    .select("rating, comment, apartments!inner(owner_id)")
    .eq("apartments.owner_id", ownerId);

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const page = pdfDoc.addPage([595, 842]);

  let y = 800;

  page.drawText("Sakani - Owner Report", { x: 50, y, size: 24, font: boldFont, color: rgb(0.18, 0.42, 0.31) });
  y -= 30;
  page.drawText(`Owner: ${profile?.full_name || "N/A"}`, { x: 50, y, size: 12, font });
  y -= 20;
  page.drawText(`Date: ${new Date().toLocaleDateString("en-US")}`, { x: 50, y, size: 10, font, color: rgb(0.5, 0.5, 0.5) });
  y -= 50;

  const totalApartments = apartments?.length || 0;
  const totalViews = apartments?.reduce((s, a) => s + (a.views || 0), 0) || 0;
  const avgPrice = apartments?.length ? Math.round(apartments.reduce((s, a) => s + a.price, 0) / apartments.length) : 0;

  page.drawText("Summary", { x: 50, y, size: 16, font: boldFont, color: rgb(0.18, 0.42, 0.31) });
  y -= 30;
  page.drawText(`Total Apartments: ${totalApartments}`, { x: 70, y, size: 12, font });
  y -= 25;
  page.drawText(`Total Views: ${totalViews}`, { x: 70, y, size: 12, font });
  y -= 25;
  page.drawText(`Average Price: ${avgPrice} EGP`, { x: 70, y, size: 12, font });
  y -= 40;

  page.drawText("Apartments", { x: 50, y, size: 16, font: boldFont, color: rgb(0.18, 0.42, 0.31) });
  y -= 30;

  for (const apt of apartments || []) {
    if (y < 100) break;
    page.drawText(`${apt.title}`, { x: 70, y, size: 11, font: boldFont });
    y -= 18;
    page.drawText(`Status: ${apt.status} | Price: ${apt.price} EGP | Views: ${apt.views || 0}`, { x: 90, y, size: 10, font });
    y -= 25;
  }

  y -= 20;
  page.drawText(`Reviews: ${reviews?.data?.length || 0} | Avg Rating: ${reviews?.data?.length ? (reviews.data.reduce((s, r) => s + r.rating, 0) / reviews.data.length).toFixed(1) : "N/A"}`, { x: 50, y, size: 12, font });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

export async function generateRentalContract(ownerId, tenantId, apartmentId) {
  const [owner, tenant, apartment] = await Promise.all([
    supabaseAdmin.from("profiles").select("*").eq("id", ownerId).single(),
    supabaseAdmin.from("profiles").select("*").eq("id", tenantId).single(),
    supabaseAdmin.from("apartments").select("*").eq("id", apartmentId).single(),
  ]);

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const page = pdfDoc.addPage([595, 842]);

  let y = 800;

  page.drawText("RENTAL CONTRACT", { x: 150, y, size: 24, font: boldFont, color: rgb(0.18, 0.42, 0.31) });
  y -= 50;

  const lines = [
    `Date: ${new Date().toLocaleDateString("en-US")}`,
    "",
    "LANDLORD (Owner):",
    `  Name: ${owner?.data?.full_name || "N/A"}`,
    `  Phone: ${owner?.data?.phone || "N/A"}`,
    "",
    "TENANT:",
    `  Name: ${tenant?.data?.full_name || "N/A"}`,
    `  Phone: ${tenant?.data?.phone || "N/A"}`,
    "",
    "PROPERTY:",
    `  Title: ${apartment?.data?.title || "N/A"}`,
    `  Address: ${apartment?.data?.address || "N/A"}`,
    `  Neighborhood: ${apartment?.data?.neighborhood || "N/A"}`,
    `  City: ${apartment?.data?.city || "Fayoum"}`,
    `  Type: ${apartment?.data?.apartment_type || "N/A"}`,
    `  Bedrooms: ${apartment?.data?.bedrooms || "N/A"}`,
    `  Area: ${apartment?.data?.area || "N/A"} sqm`,
    "",
    `  Monthly Rent: ${apartment?.data?.price || "N/A"} EGP`,
    "",
    "TERMS:",
    "  1. Tenant agrees to pay rent monthly.",
    "  2. Security deposit as agreed between parties.",
    "  3. Tenant responsible for utilities unless stated otherwise.",
    "  4. Contract duration: 12 months from signing date.",
    "",
    "SIGNATURES:",
    "",
    "Landlord: ___________________    Tenant: ___________________",
  ];

  for (const line of lines) {
    if (y < 80) break;
    page.drawText(line, { x: 60, y, size: 11, font });
    y -= 20;
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
