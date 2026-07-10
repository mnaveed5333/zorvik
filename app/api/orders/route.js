import connectDB from "@/lib/db";
import Order from "@/models/Order";
import Vendor from "@/models/Vendor";
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

// POST /api/orders -> creates order(s) from checkout
export async function POST(request) {
  try {
    await connectDB();

    const token = request.cookies.get("userToken")?.value;
    const decoded = safeVerify(token);
    const isLoggedIn = decoded && decoded.role === "customer";

    const { orderId, customerName, customerWhatsapp, subOrders } = await request.json();

    if (!orderId || !customerName || !customerWhatsapp || !subOrders?.length) {
      return NextResponse.json({ success: false, message: "Missing order details" }, { status: 400 });
    }

    const parentOrderGroup = `ORD-${Date.now()}-${isLoggedIn ? decoded.id : customerWhatsapp.replace(/[^0-9]/g, "")}`;

    const createdOrders = await Promise.all(
      subOrders.map((sub) =>
        Order.create({
          orderId,
          customer: isLoggedIn ? decoded.id : null,
          customerName,
          customerWhatsapp,
          vendor: sub.vendorId,
          vendorWhatsapp: sub.vendorWhatsapp,
          items: sub.items,
          totalAmount: sub.totalAmount,
          parentOrderGroup,
        })
      )
    );

    return NextResponse.json({ success: true, orders: createdOrders, parentOrderGroup });
  } catch (error) {
    console.error("POST /api/orders error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// GET /api/orders -> admin sees all, vendor sees own, customer sees own.
export async function GET(request) {
  try {
    await connectDB();

    const adminTokenValue = request.cookies.get("adminToken")?.value;
    const vendorTokenValue = request.cookies.get("vendorToken")?.value;
    const userTokenValue = request.cookies.get("userToken")?.value;

    const adminDecoded = safeVerify(adminTokenValue);
    const vendorDecoded = safeVerify(vendorTokenValue);
    const userDecoded = safeVerify(userTokenValue);

    let orders = [];

    if (adminDecoded && adminDecoded.role === "admin") {
      orders = await Order.find({})
        .populate("vendor", "shopName shopId whatsappNumber")
        .populate("customer", "name email")
        .sort({ createdAt: -1 });
    } else if (vendorDecoded && vendorDecoded.role === "vendor") {
      orders = await Order.find({ vendor: vendorDecoded.id })
        .populate("customer", "name email")
        .sort({ createdAt: -1 });
    } else if (userDecoded && userDecoded.role === "customer") {
      orders = await Order.find({ customer: userDecoded.id })
        .populate("vendor", "shopName whatsappNumber")
        .sort({ createdAt: -1 });
    } else {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ success: true, orders });
  } catch (error) {
    console.error("GET /api/orders error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}