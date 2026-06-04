import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    products: [
      {
        name: String,
        quantity: Number,
        price: Number,
      },
    ],
    status: {
      type: String,
      enum: ["pending", "approved", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    customerName: { type: String },
    orderDate: { type: Date, default: Date.now },
    shippingAddress: { type: String },
    totalEarnings: { type: Number, required: true },
    consumerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    farmerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
