import connectDB from "@/lib/db";
import User from "@/models/User";
import { verifyToken } from "@/utils/generateToken";
import { NextResponse } from "next/server";

// GET /api/customers -> admin only, list all customers
export async function GET(request) {
  try {
    await connectDB();

    const token = request.cookies.get("adminToken")?.value;
    const decoded = token ? verifyToken(token) : null;
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const customers = await User.find().select("-password").sort({ createdAt: -1 });
    return NextResponse.json({ success: true, customers });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}