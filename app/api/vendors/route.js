import connectDB from "@/lib/db";
import Vendor from "@/models/Vendor";
import bcrypt from "bcryptjs";
import { verifyToken } from "@/utils/generateToken";
import { NextResponse } from "next/server";

// GET /api/vendors
// - no params + adminToken -> full vendor list (admin)
// - no params + no admin session -> PUBLIC listing for "All Shops" page (?search= optional)
// - ?id=vendorId + vendorToken belonging to that vendor -> full self profile (includes cnic)
// - ?id=vendorId + adminToken -> full admin view (includes cnic)
// - ?id=vendorId (no matching auth) -> public storefront view (cnic/password/bankDetails hidden),
//   suspended vendors return 404 "Shop not found" for public/self-mismatched viewers
export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get("id");
    const search = searchParams.get("search");

    if (vendorId) {
      const vendorToken = request.cookies.get("vendorToken")?.value;
      const decodedVendor = vendorToken ? verifyToken(vendorToken) : null;

      if (decodedVendor && decodedVendor.role === "vendor" && decodedVendor.id === vendorId) {
        const vendor = await Vendor.findById(vendorId).select("-password");
        return NextResponse.json({ success: true, vendor });
      }

      const adminToken = request.cookies.get("adminToken")?.value;
      const decodedAdmin = adminToken ? verifyToken(adminToken) : null;

      if (decodedAdmin && decodedAdmin.role === "admin") {
        const vendor = await Vendor.findById(vendorId).select("-password");
        return NextResponse.json({ success: true, vendor });
      }

      const vendor = await Vendor.findById(vendorId).select("-password -bankDetails -cnic");

      // Hide suspended vendors from public storefront view — same rule as products API
      if (!vendor || vendor.status === "suspended") {
        return NextResponse.json({ success: false, message: "Shop not found" }, { status: 404 });
      }

      return NextResponse.json({ success: true, vendor });
    }

    const token = request.cookies.get("adminToken")?.value;
    const decoded = token ? verifyToken(token) : null;

    // Admin -> full vendor list (all fields except password)
    if (decoded && decoded.role === "admin") {
      const vendors = await Vendor.find().select("-password").sort({ createdAt: -1 });
      return NextResponse.json({ success: true, vendors });
    }

    // Everyone else -> public "All Shops" listing (active vendors, public fields only)
    const filter = { status: "active" };
    if (search && search.trim()) {
      filter.$or = [
        { shopName: { $regex: search.trim(), $options: "i" } },
        { shopId: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const vendors = await Vendor.find(filter)
      .select("shopId shopName shopLogo")
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, vendors });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// PATCH /api/vendors -> admin only
// body: { vendorId, action, ...fields }
// actions: "suspend" | "reactivate"
//        | "approveShopName" | "rejectShopName"
//        | "approveVendorName" | "rejectVendorName"
//        | "approveEmail" | "rejectEmail"
//        | "approveCnic" | "rejectCnic"
//        | "adminUpdate" (+ cnic, shopName, vendorName, email) -> direct edit, bypasses request flow
//        | "resetDeleteRequests" -> clears the 3-click/24hr delete counter
export async function PATCH(request) {
  try {
    await connectDB();

    const token = request.cookies.get("adminToken")?.value;
    const decoded = token ? verifyToken(token) : null;
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { vendorId, action, cnic, shopName, vendorName, email } = await request.json();
    const vendor = await Vendor.findById(vendorId);

    if (!vendor) {
      return NextResponse.json({ success: false, message: "Vendor not found" }, { status: 404 });
    }

    switch (action) {
      case "suspend":
        vendor.status = "suspended";
        vendor.suspendedAt = new Date();
        break;

      case "reactivate":
        vendor.status = "active";
        vendor.suspendedAt = null;
        break;

      case "resetDeleteRequests":
        vendor.deleteRequests = [];
        break;

      case "approveShopName":
        if (vendor.shopNameStatus === "pending" && vendor.pendingShopName) {
          vendor.shopName = vendor.pendingShopName;
        }
        vendor.pendingShopName = null;
        vendor.shopNameStatus = "none";
        break;

      case "rejectShopName":
        vendor.pendingShopName = null;
        vendor.shopNameStatus = "none";
        break;

      case "approveVendorName":
        if (vendor.vendorNameStatus === "pending" && vendor.pendingVendorName) {
          vendor.vendorName = vendor.pendingVendorName;
        }
        vendor.pendingVendorName = null;
        vendor.vendorNameStatus = "none";
        break;

      case "rejectVendorName":
        vendor.pendingVendorName = null;
        vendor.vendorNameStatus = "none";
        break;

      case "approveEmail":
        if (vendor.emailStatus === "pending" && vendor.pendingEmail) {
          const emailTaken = await Vendor.findOne({ email: vendor.pendingEmail, _id: { $ne: vendor._id } });
          if (emailTaken) {
            return NextResponse.json({ success: false, message: "That email is now taken by another vendor" }, { status: 409 });
          }
          vendor.email = vendor.pendingEmail;
        }
        vendor.pendingEmail = null;
        vendor.emailStatus = "none";
        break;

      case "rejectEmail":
        vendor.pendingEmail = null;
        vendor.emailStatus = "none";
        break;

      case "approveCnic":
        if (vendor.cnicStatus === "pending" && vendor.pendingCnic) {
          const cnicTaken = await Vendor.findOne({ cnic: vendor.pendingCnic, _id: { $ne: vendor._id } });
          if (cnicTaken) {
            return NextResponse.json({ success: false, message: "That CNIC is now in use by another vendor" }, { status: 409 });
          }
          vendor.cnic = vendor.pendingCnic;
        }
        vendor.pendingCnic = null;
        vendor.cnicStatus = "none";
        break;

      case "rejectCnic":
        vendor.pendingCnic = null;
        vendor.cnicStatus = "none";
        break;

      case "adminUpdate": {
        if (cnic && cnic.trim() !== vendor.cnic) {
          const cnicTaken = await Vendor.findOne({ cnic: cnic.trim(), _id: { $ne: vendor._id } });
          if (cnicTaken) {
            return NextResponse.json({ success: false, message: "CNIC already in use by another vendor" }, { status: 409 });
          }
          vendor.cnic = cnic.trim();
          vendor.pendingCnic = null;
          vendor.cnicStatus = "none";
        }

        if (email && email.trim().toLowerCase() !== vendor.email) {
          const emailTaken = await Vendor.findOne({ email: email.trim().toLowerCase(), _id: { $ne: vendor._id } });
          if (emailTaken) {
            return NextResponse.json({ success: false, message: "Email already in use by another vendor" }, { status: 409 });
          }
          vendor.email = email.trim().toLowerCase();
          vendor.pendingEmail = null;
          vendor.emailStatus = "none";
        }

        if (shopName && shopName.trim()) {
          vendor.shopName = shopName.trim();
          vendor.pendingShopName = null;
          vendor.shopNameStatus = "none";
        }

        if (vendorName && vendorName.trim()) {
          vendor.vendorName = vendorName.trim();
          vendor.pendingVendorName = null;
          vendor.vendorNameStatus = "none";
        }

        break;
      }

      default:
        return NextResponse.json({ success: false, message: "Invalid action" }, { status: 400 });
    }

    await vendor.save();

    const safeVendor = vendor.toObject();
    delete safeVendor.password;

    return NextResponse.json({ success: true, vendor: safeVendor });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// PUT /api/vendors -> vendor only, self-service updates
// body: { vendorId, action, ...fields }
// actions: "updateProfile" | "requestShopName" | "requestVendorName" | "requestEmail"
//          | "requestCnic" | "cancelRequest" | "changePassword"
export async function PUT(request) {
  try {
    await connectDB();

    const token = request.cookies.get("vendorToken")?.value;
    const decoded = token ? verifyToken(token) : null;
    if (!decoded || decoded.role !== "vendor") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { vendorId, action } = body;

    if (decoded.id !== vendorId) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return NextResponse.json({ success: false, message: "Vendor not found" }, { status: 404 });
    }

    switch (action) {
      case "updateProfile": {
        const { whatsappNumber, shopLogo, bankDetails } = body;
        if (whatsappNumber) vendor.whatsappNumber = whatsappNumber;
        if (shopLogo) vendor.shopLogo = shopLogo;
        if (bankDetails) vendor.bankDetails = { ...vendor.bankDetails, ...bankDetails };
        break;
      }

      case "requestShopName": {
        const { shopName } = body;
        if (!shopName || !shopName.trim()) {
          return NextResponse.json({ success: false, message: "New shop name is required" }, { status: 400 });
        }
        vendor.pendingShopName = shopName.trim();
        vendor.shopNameStatus = "pending";
        break;
      }

      case "requestVendorName": {
        const { vendorName } = body;
        if (!vendorName || !vendorName.trim()) {
          return NextResponse.json({ success: false, message: "New name is required" }, { status: 400 });
        }
        vendor.pendingVendorName = vendorName.trim();
        vendor.vendorNameStatus = "pending";
        break;
      }

      case "requestEmail": {
        const { email } = body;
        if (!email || !email.trim()) {
          return NextResponse.json({ success: false, message: "New email is required" }, { status: 400 });
        }
        const taken = await Vendor.findOne({ email: email.trim().toLowerCase(), _id: { $ne: vendor._id } });
        if (taken) {
          return NextResponse.json({ success: false, message: "That email is already in use" }, { status: 409 });
        }
        vendor.pendingEmail = email.trim().toLowerCase();
        vendor.emailStatus = "pending";
        break;
      }

      case "requestCnic": {
        const { cnic } = body;
        if (!cnic || !cnic.trim()) {
          return NextResponse.json({ success: false, message: "New CNIC is required" }, { status: 400 });
        }
        const taken = await Vendor.findOne({ cnic: cnic.trim(), _id: { $ne: vendor._id } });
        if (taken) {
          return NextResponse.json({ success: false, message: "That CNIC is already in use" }, { status: 409 });
        }
        vendor.pendingCnic = cnic.trim();
        vendor.cnicStatus = "pending";
        break;
      }

      case "cancelRequest": {
        const { field } = body;
        if (field === "shopName") {
          vendor.pendingShopName = null;
          vendor.shopNameStatus = "none";
        } else if (field === "vendorName") {
          vendor.pendingVendorName = null;
          vendor.vendorNameStatus = "none";
        } else if (field === "email") {
          vendor.pendingEmail = null;
          vendor.emailStatus = "none";
        } else if (field === "cnic") {
          vendor.pendingCnic = null;
          vendor.cnicStatus = "none";
        }
        break;
      }

      case "changePassword": {
        const { currentPassword, newPassword } = body;
        if (!currentPassword || !newPassword) {
          return NextResponse.json({ success: false, message: "Both current and new password are required" }, { status: 400 });
        }
        const isMatch = await bcrypt.compare(currentPassword, vendor.password);
        if (!isMatch) {
          return NextResponse.json({ success: false, message: "Current password is incorrect" }, { status: 401 });
        }
        if (newPassword.length < 6) {
          return NextResponse.json({ success: false, message: "New password must be at least 6 characters" }, { status: 400 });
        }
        vendor.password = await bcrypt.hash(newPassword, 10);
        break;
      }

      default:
        return NextResponse.json({ success: false, message: "Invalid action" }, { status: 400 });
    }

    await vendor.save();

    const safeVendor = vendor.toObject();
    delete safeVendor.password;

    return NextResponse.json({ success: true, vendor: safeVendor });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// DELETE /api/vendors -> admin only, handles the 3-click/24hr delete flow
// body: { vendorId }
export async function DELETE(request) {
  try {
    await connectDB();

    const token = request.cookies.get("adminToken")?.value;
    const decoded = token ? verifyToken(token) : null;
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { vendorId } = await request.json();
    const vendor = await Vendor.findById(vendorId);

    if (!vendor) {
      return NextResponse.json({ success: false, message: "Vendor not found" }, { status: 404 });
    }

    if (vendor.status !== "suspended") {
      return NextResponse.json({ success: false, message: "Vendor must be suspended first" }, { status: 400 });
    }

    const now = new Date();
    const lastClick = vendor.deleteRequests[vendor.deleteRequests.length - 1];

    if (lastClick) {
      const hoursSinceLastClick = (now - new Date(lastClick.clickedAt)) / (1000 * 60 * 60);
      if (hoursSinceLastClick < 24) {
        const hoursRemaining = (24 - hoursSinceLastClick).toFixed(1);
        return NextResponse.json(
          {
            success: false,
            message: `Please wait ${hoursRemaining} more hours before next delete click`,
            clicksCount: vendor.deleteRequests.length,
            deleteRequests: vendor.deleteRequests,
          },
          { status: 400 }
        );
      }
    }

    vendor.deleteRequests.push({ clickedAt: now });

    if (vendor.deleteRequests.length >= 3) {
      await Vendor.findByIdAndDelete(vendorId);
      return NextResponse.json({ success: true, deleted: true, message: "Vendor permanently deleted" });
    }

    await vendor.save();
    return NextResponse.json({
      success: true,
      deleted: false,
      clicksCount: vendor.deleteRequests.length,
      deleteRequests: vendor.deleteRequests,
      message: `Click ${vendor.deleteRequests.length}/3 registered. Wait 24 hours before next click.`,
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}