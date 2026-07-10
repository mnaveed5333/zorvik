import connectDB from "@/lib/db";
import Query from "@/models/Query";
import { verifyToken } from "@/utils/generateToken";
import { NextResponse } from "next/server";

// POST /api/queries -> public, customer submits a contact query (no auth, no email collected)
export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const { name, whatsappNumber, message } = body;

    if (!name || !whatsappNumber || !message) {
      return NextResponse.json({ success: false, message: "All fields are required" }, { status: 400 });
    }

    const cleanNumber = whatsappNumber.replace(/[^0-9]/g, "");
    // Must be 92 + exactly 10 digits = 12 digits total
    if (!/^92\d{10}$/.test(cleanNumber)) {
      return NextResponse.json(
        { success: false, message: "Enter a valid 10-digit WhatsApp number" },
        { status: 400 }
      );
    }

    const query = await Query.create({
      name: name.trim(),
      whatsappNumber: cleanNumber,
      message: message.trim(),
    });

    return NextResponse.json({ success: true, query });
  } catch (error) {
    console.error("QUERIES API ERROR (POST):", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// GET /api/queries -> admin only, list all queries, optional ?status=new|resolved
export async function GET(request) {
  try {
    await connectDB();

    const adminToken = request.cookies.get("adminToken")?.value;
    const decoded = adminToken ? verifyToken(adminToken) : null;
    if (!decoded) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const filter = {};
    if (status) filter.status = status;

    const queries = await Query.find(filter).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, queries });
  } catch (error) {
    console.error("QUERIES API ERROR (GET):", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// PATCH /api/queries -> admin only, body: { queryId, status }
export async function PATCH(request) {
  try {
    await connectDB();

    const adminToken = request.cookies.get("adminToken")?.value;
    const decoded = adminToken ? verifyToken(adminToken) : null;
    if (!decoded) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { queryId, status } = await request.json();
    if (!queryId || !status) {
      return NextResponse.json({ success: false, message: "Missing fields" }, { status: 400 });
    }

    const query = await Query.findByIdAndUpdate(queryId, { status }, { new: true });
    if (!query) {
      return NextResponse.json({ success: false, message: "Query not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, query });
  } catch (error) {
    console.error("QUERIES API ERROR (PATCH):", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// DELETE /api/queries -> admin only, body: { queryId }
export async function DELETE(request) {
  try {
    await connectDB();

    const adminToken = request.cookies.get("adminToken")?.value;
    const decoded = adminToken ? verifyToken(adminToken) : null;
    if (!decoded) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { queryId } = await request.json();
    await Query.findByIdAndDelete(queryId);

    return NextResponse.json({ success: true, message: "Query deleted" });
  } catch (error) {
    console.error("QUERIES API ERROR (DELETE):", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}