import express from "express";
import Farmer from "../models/Farmer.js";
import { protect } from "../middleware/authMiddleware.js";
const router = express.Router();

// Get farmer profile (mock: first farmer)
router.get("/profile", protect, async (req, res) => {
  const farmer = await Farmer.findOne();
  res.json(farmer);
});

// Update farmer profile
router.put("/profile", protect, async (req, res) => {
  const farmer = await Farmer.findOneAndUpdate({}, req.body, { new: true });
  res.json(farmer);
});

export default router;
