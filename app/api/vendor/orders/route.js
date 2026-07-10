import connectDB from "@/lib/db";
import Order from "@/models/Order";
import User from "@/models/User";
import { verifyToken } from "@/utils/generateToken";
import { NextResponse } from "next/server";

function safeVerify(token) {
  if (!token) return null;
  try {
    return verifyToken(token);
  } catch {
    return null;
  }
}

// GET /api/vendor/orders -> strictly vendor-scoped, ignores admin/user cookies entirely
export async function GET(request) {
  try {
    await connectDB();

    const vendorTokenValue = request.cookies.get("vendorToken")?.value;
    const vendorDecoded = safeVerify(vendorTokenValue);

    if (!vendorDecoded || vendorDecoded.role !== "vendor") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const orders = await Order.find({ vendor: vendorDecoded.id })
      .populate("customer", "name email")
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, orders });
  } catch (error) {
    console.error("GET /api/vendor/orders error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// PUT /api/vendor/orders -> body: { orderId, status }
// Vendor can only update status of their OWN orders.
export async function PUT(request) {
  try {
    await connectDB();

    const vendorTokenValue = request.cookies.get("vendorToken")?.value;
    const vendorDecoded = safeVerify(vendorTokenValue);

    if (!vendorDecoded || vendorDecoded.role !== "vendor") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { orderId, status } = await request.json();

    if (!orderId || !status) {
      return NextResponse.json({ success: false, message: "Missing orderId or status" }, { status: 400 });
    }

    const allowedStatuses = ["placed", "seen", "confirmed"];
    if (!allowedStatuses.includes(status)) {
      return NextResponse.json({ success: false, message: "Invalid status" }, { status: 400 });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
    }

    if (order.vendor.toString() !== vendorDecoded.id) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    order.status = status;
    await order.save();

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error("PUT /api/vendor/orders error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}