import mongoose from "mongoose";

const vendorSchema = new mongoose.Schema(
  {
    shopId: {
      type: String,
      unique: true,
    },
    vendorName: {
      type: String,
      required: true,
      trim: true,
    },
    shopName: {
      type: String,
      required: true,
      trim: true,
    },
    pendingShopName: {
      type: String,
      default: null,
    },
    shopNameStatus: {
      type: String,
      enum: ["none", "pending"],
      default: "none",
    },
    pendingVendorName: {
      type: String,
      default: null,
    },
    vendorNameStatus: {
      type: String,
      enum: ["none", "pending"],
      default: "none",
    },
    shopLogo: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    pendingEmail: {
      type: String,
      default: null,
    },
    emailStatus: {
      type: String,
      enum: ["none", "pending"],
      default: "none",
    },
    password: {
      type: String,
      required: true,
    },
    cnic: {
      type: String,
      required: true,
      unique: true,
    },
    pendingCnic: {
      type: String,
      default: null,
    },
    cnicStatus: {
      type: String,
      enum: ["none", "pending"],
      default: "none",
    },
    bankDetails: {
      accountTitle: { type: String, default: "" },
      accountNumber: { type: String, default: "" },
      bankName: { type: String, default: "" },
    },
    whatsappNumber: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "suspended"],
      default: "active",
    },
    suspendedAt: {
      type: Date,
      default: null,
    },
    role: {
      type: String,
      default: "vendor",
    },
  },
  { timestamps: true }
);

vendorSchema.pre("save", async function () {
  if (this.isNew && !this.shopId) {
    const count = await mongoose.models.Vendor.countDocuments();
    this.shopId = `SHOP-${String(count + 1).padStart(5, "0")}`;
  }
});

export default mongoose.models.Vendor || mongoose.model("Vendor", vendorSchema);