import mongoose from "mongoose";

const farmerSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    upi: { type: String },
    farmName: { type: String },
    farmAddress: { type: String },
    farmSize: { type: String },
    certifications: { type: String },
    description: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("Farmer", farmerSchema);
