import connectDB from "@/lib/db";
import Vendor from "@/models/Vendor";
import bcrypt from "bcryptjs";
import { generateToken } from "@/utils/generateToken";
import { NextResponse } from "next/server";

function buildVendorResponse(vendor) {
  return {
    id: vendor._id,
    shopId: vendor.shopId,
    vendorName: vendor.vendorName,
    shopName: vendor.shopName,
    pendingVendorName: vendor.pendingVendorName,
    vendorNameStatus: vendor.vendorNameStatus,
    pendingShopName: vendor.pendingShopName,
    shopNameStatus: vendor.shopNameStatus,
    email: vendor.email,
    pendingEmail: vendor.pendingEmail,
    emailStatus: vendor.emailStatus,
    whatsappNumber: vendor.whatsappNumber,
    shopLogo: vendor.shopLogo,
    cnic: vendor.cnic,
    status: vendor.status,
  };
}

// Clears any lingering session cookies from other roles so only one
// role's token is ever active in a browser at a time.
function clearOtherRoleCookies(response) {
  response.cookies.delete("adminToken");
  response.cookies.delete("userToken");
}

// POST /api/auth/vendor -> body: { action: "register" | "login", ...fields }
export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const { action } = body;

    if (action === "register") {
      const { vendorName, shopName, email, password, cnic, whatsappNumber, shopLogo } = body;

      if (!vendorName || !shopName || !email || !password || !cnic || !whatsappNumber) {
        return NextResponse.json(
          { success: false, message: "All required fields must be filled" },
          { status: 400 }
        );
      }

      const existingVendor = await Vendor.findOne({ $or: [{ email }, { cnic }] });
      if (existingVendor) {
        return NextResponse.json(
          { success: false, message: "Vendor already registered with this email or CNIC" },
          { status: 409 }
        );
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const vendor = await Vendor.create({
        vendorName,
        shopName,
        email,
        password: hashedPassword,
        cnic,
        whatsappNumber,
        shopLogo: shopLogo || {},
      });

      const token = generateToken({ id: vendor._id, role: "vendor" });

      const response = NextResponse.json({
        success: true,
        vendor: buildVendorResponse(vendor),
      });
      response.cookies.set("vendorToken", token, {
        httpOnly: true,
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
      clearOtherRoleCookies(response);
      return response;
    }

    if (action === "login") {
      const { email, password } = body;

      const vendor = await Vendor.findOne({ email });
      if (!vendor) {
        return NextResponse.json(
          { success: false, message: "Invalid credentials" },
          { status: 401 }
        );
      }

      const isMatch = await bcrypt.compare(password, vendor.password);
      if (!isMatch) {
        return NextResponse.json(
          { success: false, message: "Invalid credentials" },
          { status: 401 }
        );
      }

      if (vendor.status === "suspended") {
        return NextResponse.json(
          {
            success: false,
            message: "Your account has been suspended. Contact support to restore access.",
            suspended: true,
          },
          { status: 403 }
        );
      }

      const token = generateToken({ id: vendor._id, role: "vendor" });

      const response = NextResponse.json({
        success: true,
        vendor: buildVendorResponse(vendor),
      });
      response.cookies.set("vendorToken", token, {
        httpOnly: true,
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
      clearOtherRoleCookies(response);
      return response;
    }

    return NextResponse.json(
      { success: false, message: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/auth/vendor -> logout
export async function DELETE() {
  const response = NextResponse.json({ success: true, message: "Logged out" });
  response.cookies.delete("vendorToken");
  return response;
}