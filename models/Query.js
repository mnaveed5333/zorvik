import mongoose from "mongoose";

const querySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    whatsappNumber: { type: String, required: true, trim: true }, // stored as 92XXXXXXXXXX
    message: { type: String, required: true, trim: true },
    status: { type: String, enum: ["new", "resolved"], default: "new" },
  },
  { timestamps: true }
);

export default mongoose.models.Query || mongoose.model("Query", querySchema);