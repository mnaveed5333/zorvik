import { generateToken } from "@/utils/generateToken";
import { NextResponse } from "next/server";

// POST /api/auth/admin -> body: { email, password }
// Admin credentials are stored in .env.local (ADMIN_EMAIL / ADMIN_PASSWORD)
// instead of a DB collection — there's only ever one super-admin.
export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ success: false, message: "Email and password are required" }, { status: 400 });
    }

    const validEmail = email === process.env.ADMIN_EMAIL;
    const validPassword = password === process.env.ADMIN_PASSWORD;

    if (!validEmail || !validPassword) {
      return NextResponse.json({ success: false, message: "Invalid credentials" }, { status: 401 });
    }

    const token = generateToken({ id: "env-admin", role: "admin" });

    const response = NextResponse.json({
      success: true,
      admin: { id: "env-admin", name: "Zorvik Admin", email: process.env.ADMIN_EMAIL },
    });
    response.cookies.set("adminToken", token, { httpOnly: true, path: "/", maxAge: 60 * 60 * 24 * 7 });
    return response;
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// DELETE /api/auth/admin -> logout
export async function DELETE() {
  const response = NextResponse.json({ success: true, message: "Logged out" });
  response.cookies.delete("adminToken");
  return response;
}