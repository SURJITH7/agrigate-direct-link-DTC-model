import express from "express";
const router = express.Router();
import { protect } from "../middleware/authMiddleware.js";
import { uploadProfilePic } from "../middleware/uploadMiddleware.js";
import {
  registerUser,
  loginUser,
  loginAdmin,
  logoutUser,
  getUserProfile,
  updateUserProfile,
  verifyEmailWithOTP,
  updateUserLocation,
  getFarmersWithLocations,
  getUsersByRole,
} from "../components/userController.js";

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/admin/login", loginAdmin); // New admin login route
router.post("/logout", logoutUser);
router.post("/verify-email", protect, verifyEmailWithOTP); // Email verification in profile
router
  .route("/profile")
  .get(protect, getUserProfile)
  .put(protect, uploadProfilePic.single("profilePic"), updateUserProfile);

router.put("/location", protect, updateUserLocation);

// Get farmers with locations for map
router.get("/farmers/locations", getFarmersWithLocations);

// Get users by role
router.get("/", getUsersByRole);

export default router;
