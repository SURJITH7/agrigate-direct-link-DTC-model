import express from "express";
const router = express.Router();
import {
  registerAdmin,
  getAdminProfile,
  getAllUsers,
  getDashboardStats,
  updateUser,
  deleteUser,
} from "../components/userController.js";

// All routes in this file are automatically protected and admin-only
// because of how they are mounted in server.js

router.post("/register", registerAdmin);
router.get("/profile", getAdminProfile);
router.get("/stats", getDashboardStats);
router.get("/users", getAllUsers);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);

export default router;
