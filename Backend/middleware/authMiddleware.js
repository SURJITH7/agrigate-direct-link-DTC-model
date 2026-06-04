import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import Admin from "../models/Admin.js";

// Middleware to protect routes
const protect = asyncHandler(async (req, res, next) => {
  let token;
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  if (!token) {
    res.status(401);
    throw new Error("Not authorized, no token");
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attempt to find the user in either the User or Admin collection
    let user = await User.findById(decoded.id).select("-password").lean();

    if (!user) {
      user = await Admin.findById(decoded.id).select("-password").lean();
    }

    if (!user) {
      res.status(401);
      throw new Error("Not authorized, user not found");
    }
    req.user = user;

    next();
  } catch (error) {
    //Consider logging the error for debugging purposes
    console.error("JWT Verification Error:", error);
    console.error("Full error:", error.stack);
    res.status(401);
    throw new Error("Not authorized, token failed");
  }
});

const optionalProtect = asyncHandler(async (req, res, next) => {
  let token;
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  if (!token) {
    return next();
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    let user = await User.findById(decoded.id).select("-password").lean();
    if (!user) {
      user = await Admin.findById(decoded.id).select("-password").lean();
    }
    if (user) {
      req.user = user;
    }
  } catch (error) {
    console.error("Optional JWT Verification Error:", error.message);
  }
  next();
});

const isFarmer = (req, res, next) => {
  if (req.user && req.user.role === "farmer") {
    next();
  } else {
    res.status(403);
    throw new Error("User is not a farmer");
  }
};

const isConsumer = (req, res, next) => {
  if (req.user && req.user.role === "consumer") {
    next();
  } else {
    res.status(403);
    throw new Error("User is not a consumer");
  }
};

const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(401);
    throw new Error("Not authorized as an admin");
  }
};

export { protect, optionalProtect, isFarmer, isConsumer, isAdmin };
