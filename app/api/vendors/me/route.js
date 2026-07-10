import connectDB from "@/lib/db";
import Vendor from "@/models/Vendor";
import { verifyToken } from "@/utils/generateToken";
import { NextResponse } from "next/server";

// GET /api/vendors/me -> resolves the logged-in vendor purely from the vendorToken cookie
export async function GET(request) {
  try {
    await connectDB();

    const token = request.cookies.get("vendorToken")?.value;
    const decoded = token ? verifyToken(token) : null;

    if (!decoded || decoded.role !== "vendor") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const vendor = await Vendor.findById(decoded.id).select("-password");
    if (!vendor) {
      return NextResponse.json({ success: false, message: "Vendor not found" }, { status: 404 });
    }

    // Normalize to always include `id` (not just Mongo's `_id`), since
    // every page/component in the app reads vendor.id. Without this,
    // any setVendor(...) call fed from this route silently wipes the
    // vendor's id from Redux, breaking vendorId-guarded fetches on
    // navigation.
    const vendorObj = vendor.toObject();
    vendorObj.id = vendorObj._id.toString();

    return NextResponse.json({ success: true, vendor: vendorObj });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}