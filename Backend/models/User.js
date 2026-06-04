import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: {
      type: String,
      required: true,
      enum: ["farmer", "consumer", "admin"],
      default: "consumer",
    },
    // Email verification fields
    isVerified: {
      type: Boolean,
      default: false,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    // Farmer-specific fields
    farmName: { type: String },
    farmAddress: { type: String },
    upi: { type: String },
    farmSize: { type: String },
    certifications: { type: String },
    description: { type: String },
    phone: { type: String },
    profilePic: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
    locationName: { type: String },
    // Consumer-specific fields
    deliveryAddress: { type: String },
  },
  { timestamps: true },
);

// Password hashing middleware
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Password comparison method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;
