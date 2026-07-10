import { uploadImage, deleteImage } from "@/lib/cloudinary";
import { NextResponse } from "next/server";

// POST /api/upload -> body: { fileBase64, folder, resourceType }
export async function POST(request) {
  try {
    const { fileBase64, folder, resourceType = "image" } = await request.json();
    if (!fileBase64) {
      return NextResponse.json(
        { success: false, message: "No file provided" },
        { status: 400 }
      );
    }
    const result = await uploadImage(fileBase64, folder, resourceType);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("UPLOAD ERROR:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/upload -> body: { publicId, resourceType }
export async function DELETE(request) {
  try {
    const { publicId, resourceType = "image" } = await request.json();
    if (!publicId) {
      return NextResponse.json(
        { success: false, message: "No publicId provided" },
        { status: 400 }
      );
    }
    await deleteImage(publicId, resourceType);
    return NextResponse.json(
      { success: true, message: "Media deleted" }
    );
  } catch (error) {
    console.error("DELETE ERROR:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}