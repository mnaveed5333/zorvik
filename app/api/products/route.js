import connectDB from "@/lib/db";
import Product from "@/models/Product";
import Vendor from "@/models/Vendor";
import Category from "@/models/Category";
import { verifyToken } from "@/utils/generateToken";
import { NextResponse } from "next/server";

// GET /api/products -> supports ?category=slug&search=term&vendor=id&id=productId&limit=n&context=admin
export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const vendorId = searchParams.get("vendor");
    const categoryId = searchParams.get("category");
    const productId = searchParams.get("id");
    const limit = parseInt(searchParams.get("limit")) || 0;
    const context = searchParams.get("context");

    // Admin bypass only applies when the request explicitly comes from an
    // admin page (?context=admin). This stops a leftover adminToken cookie
    // in the same browser from leaking suspended vendors' products to the
    // customer storefront.
    const adminToken = request.cookies.get("adminToken")?.value;
    const isAdmin = context === "admin" && adminToken ? Boolean(verifyToken(adminToken)) : false;

    if (productId) {
      const product = await Product.findById(productId)
        .populate("vendor", "shopName shopId shopLogo whatsappNumber status")
        .populate("category", "name slug");

      if (!product || (!isAdmin && product.vendor?.status === "suspended")) {
        return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 });
      }

      return NextResponse.json({ success: true, product });
    }

    const filter = { isActive: true };
    if (vendorId) filter.vendor = vendorId;
    if (categoryId) filter.category = categoryId;

    // Multi-field search: product name, category name, vendor shop name
    if (search) {
      const regex = { $regex: search, $options: "i" };

      const [matchingCategories, matchingVendors] = await Promise.all([
        Category.find({ name: regex }).select("_id"),
        Vendor.find({ shopName: regex }).select("_id"),
      ]);

      const categoryIds = matchingCategories.map((c) => c._id);
      const vendorIds = matchingVendors.map((v) => v._id);

      filter.$or = [
        { name: regex },
        { category: { $in: categoryIds } },
        { vendor: { $in: vendorIds } },
      ];
    }

    if (!isAdmin) {
      const suspendedVendors = await Vendor.find({ status: "suspended" }).select("_id");
      const suspendedVendorIds = suspendedVendors.map((v) => v._id.toString());

      // Customer hitting a specific suspended vendor's shop page -> empty, not their products
      if (vendorId && suspendedVendorIds.includes(vendorId)) {
        return NextResponse.json({ success: true, products: [] });
      }

      // General listing/search -> strip out suspended vendors' products
      if (!vendorId) {
        const suspendedFilter = { vendor: { $nin: suspendedVendorIds } };
        // Merge with existing $or search filter using $and so both conditions apply
        if (filter.$or) {
          filter.$and = [{ $or: filter.$or }, suspendedFilter];
          delete filter.$or;
        } else {
          filter.vendor = suspendedFilter.vendor;
        }
      }
    }

    let query = Product.find(filter)
      .populate("vendor", "shopName shopId shopLogo whatsappNumber")
      .populate("category", "name slug")
      .sort({ createdAt: -1 });

    if (limit) query = query.limit(limit);

    const products = await query;

    return NextResponse.json({ success: true, products });
  } catch (error) {
    console.error("PRODUCTS API ERROR (GET):", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// POST /api/products -> vendor only, create product
export async function POST(request) {
  try {
    await connectDB();

    const token = request.cookies.get("vendorToken")?.value;
    const decoded = token ? verifyToken(token) : null;
    if (!decoded || decoded.role !== "vendor") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, price, category, images, sizePool, colorPool, video } = body;

    if (!name || !description || !price || !category || !images?.length) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
    }

    const product = await Product.create({
      vendor: decoded.id,
      name,
      description,
      price,
      category,
      images,
      sizePool: sizePool || [],
      colorPool: colorPool || [],
      video: video || null,
    });

    return NextResponse.json({ success: true, product });
  } catch (error) {
    console.error("PRODUCTS API ERROR (POST):", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// PUT /api/products -> vendor only, update product, body: { productId, ...fields }
export async function PUT(request) {
  try {
    await connectDB();

    const token = request.cookies.get("vendorToken")?.value;
    const decoded = token ? verifyToken(token) : null;
    if (!decoded || decoded.role !== "vendor") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { productId, ...updateFields } = body;

    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 });
    }

    if (product.vendor.toString() !== decoded.id) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    Object.assign(product, updateFields);
    await product.save();

    return NextResponse.json({ success: true, product });
  } catch (error) {
    console.error("PRODUCTS API ERROR (PUT):", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// DELETE /api/products -> vendor only, body: { productId }
export async function DELETE(request) {
  try {
    await connectDB();

    const token = request.cookies.get("vendorToken")?.value;
    const decoded = token ? verifyToken(token) : null;
    if (!decoded || decoded.role !== "vendor") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { productId } = await request.json();
    const product = await Product.findById(productId);

    if (!product) {
      return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 });
    }

    if (product.vendor.toString() !== decoded.id) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    await Product.findByIdAndDelete(productId);
    return NextResponse.json({ success: true, message: "Product deleted" });
  } catch (error) {
    console.error("PRODUCTS API ERROR (DELETE):", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}