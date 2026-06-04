import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import Admin from "../models/Admin.js";
import OTP from "../models/OTP.js";
import generateToken from "./generateToken.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";

const reverseGeocode = async (lat, lon) => {
  if (lat == null || lon == null) return "";
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
    );
    const data = await response.json();
    return data.display_name || "";
  } catch (err) {
    console.error("Reverse geocoding failed:", err);
    return "";
  }
};

// @desc    Register a new user (requires OTP verification first)
// @route   POST /api/users/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const {
    fullName,
    email,
    password,
    confirmPassword,
    role,
    farmName,
    farmAddress,
    upi,
    deliveryAddress,
    phone,
    latitude,
    longitude,
    locationName,
  } = req.body;

  // Validate required fields
  if (!fullName || !email || !password || !confirmPassword) {
    res.status(400);
    throw new Error("Please provide all required fields");
  }

  // Validate password match
  if (password !== confirmPassword) {
    res.status(400);
    throw new Error("Passwords do not match");
  }

  // Validate password strength (at least 6 characters)
  if (password.length < 6) {
    res.status(400);
    throw new Error("Password must be at least 6 characters long");
  }

  const normalizedEmail = email.toLowerCase();

  // Allow existing users to register again (update profile)
  // Email verification will be handled in profile update endpoint

  let finalLocationName = locationName;
  if (!finalLocationName && latitude && longitude) {
    finalLocationName = await reverseGeocode(latitude, longitude);
  }

  const user = await User.create({
    fullName,
    email: normalizedEmail,
    password,
    role: role || "consumer",
    phone,
    isVerified: false, // Email verification optional - can be done in profile
    verifiedAt: null,
    farmName: role === "farmer" ? farmName : undefined,
    farmAddress: role === "farmer" ? farmAddress : undefined,
    upi: role === "farmer" ? upi : undefined,
    deliveryAddress: role === "consumer" ? deliveryAddress : undefined,
    latitude: role === "farmer" || role === "consumer" ? latitude : undefined,
    longitude: role === "farmer" || role === "consumer" ? longitude : undefined,
    locationName: finalLocationName,
  });

  if (user) {
    // Set JWT in httpOnly cookie
    generateToken(res, user._id);
    // include absolute URL for profilePic when available
    const host = req.protocol + "://" + req.get("host");
    res.status(201).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      profilePic: user.profilePic ? host + user.profilePic : null,
    });
  } else {
    res.status(400);
    throw new Error("Invalid user data");
  }
});

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  // Email verification is now optional - users can verify in profile
  if (await user.matchPassword(password)) {
    // Set JWT in httpOnly cookie
    generateToken(res, user._id);
    const host = req.protocol + "://" + req.get("host");
    res.json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      profilePic: user.profilePic ? host + user.profilePic : null,
    });
  } else {
    res.status(401);
    throw new Error("Invalid email or password");
  }
});

// @desc    Auth admin & get token
// @route   POST /api/admin/login
// @access  Public
const loginAdmin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const admin = await Admin.findOne({ email });

  if (admin && (await admin.matchPassword(password))) {
    generateToken(res, admin._id);
    const host = req.protocol + "://" + req.get("host");
    res.json({
      _id: admin._id,
      fullName: admin.fullName,
      email: admin.email,
      role: admin.role,
      // Admins likely don't have profile pics, but handle if they do
      profilePic: admin.profilePic ? host + admin.profilePic : null,
    });
  } else {
    res.status(401);
    throw new Error("Invalid email or password");
  }
});

// @desc    Logout user
// @route   POST /api/users/logout
// @access  Public
const logoutUser = asyncHandler(async (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    expires: new Date(0),
  });
  res.status(200).json({ message: "Logged out successfully" });
});

// @desc    Get admin profile
// @route   GET /api/admin/profile
// @access  Private
const getAdminProfile = asyncHandler(async (req, res) => {
  // NOTE: req.user is populated by the 'protect' middleware which finds a user
  // in either the User or Admin collection.
  const admin = await Admin.findById(req.user._id);

  if (admin) {
    res.json({
      _id: admin._id,
      fullName: admin.fullName,
      email: admin.email,
      role: admin.role,
    });
  } else {
    res.status(404);
    throw new Error("Admin not found");
  }
});

// @desc    Register a new admin by an existing admin
// @route   POST /api/admin/register
// @access  Private/Admin
const registerAdmin = asyncHandler(async (req, res) => {
  const { fullName, email, password } = req.body;

  const adminExists = await Admin.findOne({ email });

  if (adminExists) {
    res.status(400);
    throw new Error("Admin with that email already exists");
  }

  const admin = await Admin.create({
    fullName,
    email,
    password,
  });

  if (admin) {
    res
      .status(201)
      .json({ _id: admin._id, fullName: admin.fullName, email: admin.email });
  } else {
    res.status(400);
    throw new Error("Invalid admin data");
  }
});

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    const userProfile = {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      phone: user.phone,
      isVerified: user.isVerified, // Include email verification status
      profilePic: user.profilePic
        ? req.protocol + "://" + req.get("host") + user.profilePic
        : null,
    };

    if (user.role === "farmer") {
      userProfile.farmName = user.farmName;
      userProfile.farmAddress = user.farmAddress;
      userProfile.upi = user.upi;
      userProfile.farmSize = user.farmSize;
      userProfile.certifications = user.certifications;
      userProfile.description = user.description;
      userProfile.latitude = user.latitude;
      userProfile.longitude = user.longitude;
      userProfile.locationName = user.locationName;
    } else if (user.role === "consumer") {
      userProfile.deliveryAddress = user.deliveryAddress;
      userProfile.latitude = user.latitude;
      userProfile.longitude = user.longitude;
      userProfile.locationName = user.locationName;
    }
    res.json(userProfile);
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
  const userToUpdate = await User.findById(req.user._id);

  if (!userToUpdate) {
    res.status(404);
    throw new Error("User not found");
  }

  let allowedFields;
  if (userToUpdate.role === "farmer") {
    allowedFields = [
      "fullName",
      "phone",
      "farmName",
      "farmAddress",
      "upi",
      "farmSize",
      "certifications",
      "description",
      "latitude",
      "longitude",
      "locationName",
      "profilePic",
    ];
  } else if (userToUpdate.role === "consumer") {
    allowedFields = [
      "fullName",
      "phone",
      "deliveryAddress",
      "latitude",
      "longitude",
      "locationName",
      "profilePic",
    ];
  } else {
    // For admin or other roles, only allow basic updates
    allowedFields = ["fullName", "phone"];
  }

  const updates = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  if (req.file) {
    // multer sets req.file.filename based on our storage config
    updates.profilePic = `/images/${req.file.filename}`;
  }

  // If address is updated but not lat/lng, geocode it.
  // Note: This is a simplified example. A real app might use a more robust geocoding service.
  if (
    updates.locationName &&
    (updates.latitude === undefined || updates.longitude === undefined)
  ) {
    // In a real app, you would geocode the `locationName` to get lat/lng.
    // For this example, we'll assume lat/lng are sent with locationName or cleared.
    // If only locationName is sent, we could clear lat/lng to indicate they are stale.
    updates.latitude = null;
    updates.longitude = null;
  }

  const updatedUser = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
  }).select("-password");

  // Construct the response object directly from the updated user
  // to ensure the new profile picture path is included.
  const host = req.protocol + "://" + req.get("host");
  const userProfile = {
    _id: updatedUser._id,
    fullName: updatedUser.fullName,
    email: updatedUser.email,
    role: updatedUser.role,
    phone: updatedUser.phone,
    isVerified: updatedUser.isVerified, // Include email verification status
    profilePic: updatedUser.profilePic ? host + updatedUser.profilePic : null,
  };

  if (updatedUser.role === "farmer") {
    userProfile.farmName = updatedUser.farmName;
    userProfile.farmAddress = updatedUser.farmAddress;
    userProfile.upi = updatedUser.upi;
    userProfile.farmSize = updatedUser.farmSize;
    userProfile.certifications = updatedUser.certifications;
    userProfile.description = updatedUser.description;
    userProfile.latitude = updatedUser.latitude;
    userProfile.longitude = updatedUser.longitude;
    userProfile.locationName = updatedUser.locationName;
  }

  res.json(userProfile);
});

// @desc    Update user's real-time location
// @route   PUT /api/users/location
// @access  Private
const updateUserLocation = asyncHandler(async (req, res) => {
  const { latitude, longitude, name } = req.body;

  if (typeof latitude !== "number" || typeof longitude !== "number") {
    res.status(400);
    throw new Error("Invalid latitude or longitude");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { latitude, longitude, locationName: name },
    { new: true },
  );

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  res.status(200).json({ message: "Location updated successfully" });
});

// @desc    Get all users (farmers and consumers)
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find({ role: { $ne: "admin" } }).select("-password");
  res.json(users);
});

// @desc    Get dashboard stats
// @route   GET /api/admin/stats
// @access  Private/Admin
const getDashboardStats = asyncHandler(async (req, res) => {
  const totalUsers = await User.countDocuments({ role: { $ne: "admin" } });
  const totalProducts = await Product.countDocuments();
  const totalOrders = await Order.countDocuments();

  // Get total sales from delivered orders
  const salesData = await Order.aggregate([
    { $match: { status: "delivered" } },
    { $group: { _id: null, totalSales: { $sum: "$totalEarnings" } } },
  ]);

  // Calculate total commission from all products sold
  const commissionData = await Order.aggregate([
    { $match: { status: "delivered" } },
    { $unwind: "$products" },
    {
      $lookup: {
        from: "products",
        localField: "products.productId",
        foreignField: "_id",
        as: "productDetails",
      },
    },
    {
      $unwind: {
        path: "$productDetails",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $group: {
        _id: null,
        totalCommission: {
          $sum: {
            $multiply: [
              "$products.price",
              {
                $divide: [
                  { $ifNull: ["$productDetails.commission", 3] },
                  100,
                ],
              },
            ],
          },
        },
      },
    },
  ]);

  const totalCommission =
    commissionData.length > 0 ? Math.round(commissionData[0].totalCommission * 100) / 100 : 0;

  res.json({
    totalUsers,
    totalProducts,
    totalOrders,
    totalSales: salesData.length > 0 ? salesData[0].totalSales : 0,
    totalCommission: totalCommission,
  });
});

// @desc    Update User (Admin)
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    user.fullName = req.body.fullName || user.fullName;
    user.email = req.body.email || user.email;
    user.role = req.body.role || user.role;

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      fullName: updatedUser.fullName,
      email: updatedUser.email,
      role: updatedUser.role,
      createdAt: updatedUser.createdAt,
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

// @desc    Verify email with OTP and update user profile
// @route   POST /api/users/verify-email
// @access  Private
const verifyEmailWithOTP = asyncHandler(async (req, res) => {
  const { email, otp, method = "email" } = req.body;
  const userId = req.user._id;

  if (!email || !otp) {
    res.status(400);
    throw new Error("Email and OTP are required");
  }

  const normalizedEmail = email.toLowerCase();

  // Check if OTP is verified
  const otpRecord = await OTP.findOne({
    email: normalizedEmail,
    method: method,
    otp: otp.toString(),
    verified: true,
  });

  if (!otpRecord) {
    res.status(400);
    throw new Error("Invalid or unverified OTP. Please verify OTP first.");
  }

  // Update user as verified
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { isVerified: true, verifiedAt: new Date() },
    { new: true },
  ).select("-password");

  // Delete the used OTP
  await OTP.deleteOne({ _id: otpRecord._id });

  console.log(`✓ Email verified for user: ${normalizedEmail}`);

  res.json({
    success: true,
    message: "Email verified successfully",
    isVerified: updatedUser.isVerified,
  });
});

// @desc    Delete User (Admin)
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);

  if (user) {
    res.json({ message: "User removed successfully" });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

// @desc    Get farmers with locations for map
// @route   GET /api/users/farmers/locations
// @access  Public
const getFarmersWithLocations = asyncHandler(async (req, res) => {
  const farmers = await User.find({
    role: "farmer",
    latitude: { $exists: true, $ne: null },
    longitude: { $exists: true, $ne: null },
  })
    .select(
      "fullName farmName farmAddress locationName latitude longitude phone upi description",
    )
    .lean();

  res.json(farmers);
});

// @desc    Get users by role
// @route   GET /api/users?role=farmer
// @access  Public
const getUsersByRole = asyncHandler(async (req, res) => {
  const { role } = req.query;

  if (!role) {
    res.status(400);
    throw new Error("Role query parameter is required");
  }

  const query = { role };

  // If role is farmer, only return users with valid locations
  if (role === "farmer") {
    query.latitude = { $exists: true, $ne: null };
    query.longitude = { $exists: true, $ne: null };
  }

  const users = await User.find(query)
    .select(
      "fullName farmName farmAddress locationName latitude longitude phone email upi description certifications farmSize deliveryAddress",
    )
    .lean();

  res.json(users);
});

export {
  registerUser,
  loginUser,
  loginAdmin,
  getAdminProfile,
  logoutUser,
  getUserProfile,
  updateUserProfile,
  verifyEmailWithOTP,
  updateUserLocation,
  registerAdmin,
  getAllUsers,
  getDashboardStats,
  updateUser,
  deleteUser,
  getFarmersWithLocations,
  getUsersByRole,
};
