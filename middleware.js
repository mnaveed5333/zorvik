import { NextResponse } from "next/server";
import { verifyToken } from "./utils/generateToken";
import connectDB from "@/lib/db";
import Vendor from "@/models/Vendor";

export const config = {
  runtime: "nodejs",
  matcher: ["/vendor/:path*", "/admin/:path*"],
};

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  const isVendorAuthPage =
    pathname.startsWith("/vendor/login") ||
    pathname.startsWith("/vendor/register") ||
    pathname.startsWith("/vendor/suspended");

  const isAdminAuthPage = pathname.startsWith("/admin/login");

  const vendorProtected =
    !isVendorAuthPage &&
    (pathname.startsWith("/vendor/dashboard") ||
      pathname.startsWith("/vendor/products") ||
      pathname.startsWith("/vendor/orders") ||
      pathname.startsWith("/vendor/settings"));

  const adminProtected =
    !isAdminAuthPage &&
    (pathname.startsWith("/admin/dashboard") ||
      pathname.startsWith("/admin/vendors") ||
      pathname.startsWith("/admin/categories") ||
      pathname.startsWith("/admin/orders") ||
      pathname.startsWith("/admin/customers") ||
      pathname.startsWith("/admin/reports"));

  if (vendorProtected) {
    const token = request.cookies.get("vendorToken")?.value;
    const decoded = token ? verifyToken(token) : null;

    if (!decoded) {
      return NextResponse.redirect(new URL("/vendor/login", request.url));
    }

    // Live DB check so a mid-session suspension takes effect immediately,
    // not just on the next login.
    try {
      await connectDB();
      const vendor = await Vendor.findById(decoded.id).select("status");

      if (!vendor) {
        // Vendor genuinely doesn't exist anymore -> logout is correct here.
        const response = NextResponse.redirect(new URL("/vendor/login", request.url));
        response.cookies.delete("vendorToken");
        return response;
      }

      if (vendor.status === "suspended") {
        return NextResponse.redirect(new URL("/vendor/suspended", request.url));
      }
    } catch (error) {
      // DB/connection hiccup (timeout, transient network issue, etc).
      // This is NOT an auth failure -> fail OPEN instead of logging the
      // vendor out. The token itself is still valid (verified above),
      // so let the request through; the next successful check will
      // still catch a real suspension.
      console.error("MIDDLEWARE VENDOR CHECK ERROR (failing open):", error);
      return NextResponse.next();
    }
  }

  if (adminProtected) {
    const token = request.cookies.get("adminToken")?.value;
    if (!token || !verifyToken(token)) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return NextResponse.next();
}