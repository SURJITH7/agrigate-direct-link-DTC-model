import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    description: { type: String },
    category: { type: String, required: true },
    image: { type: String },
    unit: { type: String, required: true },
    harvestTime: { type: String },
    status: {
      type: String,
      enum: ["approved", "pending", "rejected"],
      default: "pending",
    },
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
    approvalNotes: {
      type: String,
      default: null,
    },
    // Admin commission management
    commission: {
      type: Number,
      default: 3, // Default 3%
      min: 2,
      max: 5,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Product", productSchema);
