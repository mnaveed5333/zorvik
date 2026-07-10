import connectDB from "@/lib/db";
import Category from "@/models/Category";
import Product from "@/models/Product";
import { verifyToken } from "@/utils/generateToken";
import { NextResponse } from "next/server";

// GET /api/categories -> list all categories (public, used by vendors + customers)
// includes productCount per category
export async function GET() {
  try {
    await connectDB();

    const categories = await Category.find().sort({ createdAt: 1 }).lean();

    const counts = await Product.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);
    const countMap = {};
    counts.forEach((c) => {
      countMap[String(c._id)] = c.count;
    });

    const withCounts = categories.map((cat) => ({
      ...cat,
      productCount: countMap[String(cat._id)] || 0,
    }));

    return NextResponse.json({ success: true, categories: withCounts });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// POST /api/categories -> admin only, add new category
export async function POST(request) {
  try {
    await connectDB();

    const token = request.cookies.get("adminToken")?.value;
    const decoded = token ? verifyToken(token) : null;
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { name } = await request.json();
    if (!name) {
      return NextResponse.json({ success: false, message: "Category name is required" }, { status: 400 });
    }

    const slug = name.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    const existing = await Category.findOne({ slug });
    if (existing) {
      return NextResponse.json({ success: false, message: "Category already exists" }, { status: 409 });
    }

    const category = await Category.create({ name, slug, isDefault: false, createdBy: "admin" });
    return NextResponse.json({ success: true, category });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// DELETE /api/categories -> admin only, body: { categoryId, confirmed: true }
// Confirmation (5x "Yes") is enforced client-side in the modal; this route
// requires an explicit `confirmed: true` flag so it can never be hit by accident.
export async function DELETE(request) {
  try {
    await connectDB();

    const token = request.cookies.get("adminToken")?.value;
    const decoded = token ? verifyToken(token) : null;
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { categoryId, confirmed } = await request.json();

    if (!confirmed) {
      return NextResponse.json({ success: false, message: "Delete not confirmed" }, { status: 400 });
    }

    const category = await Category.findById(categoryId);
    if (!category) {
      return NextResponse.json({ success: false, message: "Category not found" }, { status: 404 });
    }

    if (category.isDefault) {
      return NextResponse.json({ success: false, message: "Default categories cannot be deleted" }, { status: 403 });
    }

    // Delete all products under this category first (this is what removes them from customer view)
    const deletedProducts = await Product.deleteMany({ category: categoryId });

    // Then delete the category itself
    await Category.findByIdAndDelete(categoryId);

    return NextResponse.json({
      success: true,
      deleted: true,
      message: `Category deleted along with ${deletedProducts.deletedCount} product(s)`,
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}