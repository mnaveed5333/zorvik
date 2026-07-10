import connectDB from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { generateToken } from "@/utils/generateToken";
import { NextResponse } from "next/server";

// POST /api/auth/customer  -> body: { action: "register" | "login", ...fields }
export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const { action } = body;

    if (action === "register") {
      const { name, email, password, whatsappNumber } = body;

      if (!name || !email || !password) {
        return NextResponse.json({ success: false, message: "All fields are required" }, { status: 400 });
      }

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return NextResponse.json({ success: false, message: "Email already registered" }, { status: 409 });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await User.create({
        name,
        email,
        password: hashedPassword,
        whatsappNumber: whatsappNumber || null,
      });

      const token = generateToken({ id: user._id, role: "customer" });

      const response = NextResponse.json({
        success: true,
        user: { id: user._id, name: user.name, email: user.email },
      });
      response.cookies.set("userToken", token, { httpOnly: true, path: "/", maxAge: 60 * 60 * 24 * 7 });
      return response;
    }

    if (action === "login") {
      const { email, password } = body;

      const user = await User.findOne({ email });
      if (!user || !user.password) {
        return NextResponse.json({ success: false, message: "Invalid credentials" }, { status: 401 });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return NextResponse.json({ success: false, message: "Invalid credentials" }, { status: 401 });
      }

      const token = generateToken({ id: user._id, role: "customer" });

      const response = NextResponse.json({
        success: true,
        user: { id: user._id, name: user.name, email: user.email },
      });
      response.cookies.set("userToken", token, { httpOnly: true, path: "/", maxAge: 60 * 60 * 24 * 7 });
      return response;
    }

    return NextResponse.json({ success: false, message: "Invalid action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// DELETE /api/auth/customer -> logout
export async function DELETE() {
  const response = NextResponse.json({ success: true, message: "Logged out" });
  response.cookies.delete("userToken");
  return response;
}