import { Router } from "express";
import { supabaseAdmin } from "../config.js";
import { verifyAuth, verifyAdmin } from "../middleware/auth.js";
import { generateAdminReport, generateOwnerReport, generateRentalContract } from "../services/pdfService.js";

const router = Router();

router.get("/admin", verifyAdmin, async (req, res) => {
  try {
    const pdfBuffer = await generateAdminReport();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=sakani-admin-report.pdf");
    res.send(pdfBuffer);
  } catch (err) {
    console.error("Admin report error:", err);
    res.status(500).json({ error: "Report generation failed" });
  }
});

router.get("/owner", verifyAuth, async (req, res) => {
  try {
    const pdfBuffer = await generateOwnerReport(req.user.id);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=sakani-owner-report.pdf");
    res.send(pdfBuffer);
  } catch (err) {
    console.error("Owner report error:", err);
    res.status(500).json({ error: "Report generation failed" });
  }
});

router.get("/contract/:apartmentId/:tenantId", verifyAuth, async (req, res) => {
  try {
    const { apartmentId, tenantId } = req.params;
    const { data: apartment } = await supabaseAdmin
      .from("apartments")
      .select("owner_id")
      .eq("id", apartmentId)
      .single();

    if (!apartment || apartment.owner_id !== req.user.id) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const pdfBuffer = await generateRentalContract(req.user.id, tenantId, apartmentId);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=rental-contract.pdf");
    res.send(pdfBuffer);
  } catch (err) {
    console.error("Contract error:", err);
    res.status(500).json({ error: "Contract generation failed" });
  }
});

export default router;
