import { Router } from "express";
import { verifyAuth } from "../middleware/auth.js";
import { geocodeAddress, reverseGeocode, findNearbyPlaces } from "../services/mapsService.js";

const router = Router();

router.post("/geocode", verifyAuth, async (req, res) => {
  try {
    const { address } = req.body;
    if (!address) return res.status(400).json({ error: "Address is required" });

    const result = await geocodeAddress(address);
    if (result.error) return res.status(400).json(result);

    res.json(result);
  } catch (err) {
    console.error("Geocode error:", err);
    res.status(500).json({ error: "Geocoding failed" });
  }
});

router.post("/reverse-geocode", verifyAuth, async (req, res) => {
  try {
    const { lat, lng } = req.body;
    if (!lat || !lng) return res.status(400).json({ error: "lat and lng are required" });

    const result = await reverseGeocode(lat, lng);
    if (result.error) return res.status(400).json(result);

    res.json(result);
  } catch (err) {
    console.error("Reverse geocode error:", err);
    res.status(500).json({ error: "Reverse geocoding failed" });
  }
});

router.post("/nearby", verifyAuth, async (req, res) => {
  try {
    const { lat, lng, type = "restaurant", radius = 5000 } = req.body;
    if (!lat || !lng) return res.status(400).json({ error: "lat and lng are required" });

    const result = await findNearbyPlaces(lat, lng, type, radius);
    if (result.error) return res.status(400).json(result);

    res.json(result);
  } catch (err) {
    console.error("Nearby search error:", err);
    res.status(500).json({ error: "Nearby search failed" });
  }
});

export default router;
