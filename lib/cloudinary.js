import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads a file (image, video, or raw) to Cloudinary.
 * @param {string} fileBase64 - Base64-encoded file data.
 * @param {string} folder - Cloudinary folder path (default: "zorvik").
 * @param {string} resourceType - Type of resource: "image", "video", or "raw" (default: "image").
 * @returns {Promise<{url: string, publicId: string}>} - Secure URL and public ID of the uploaded file.
 */
export const uploadImage = async (
  fileBase64,
  folder = "zorvik",
  resourceType = "image"
) => {
  try {
    const result = await cloudinary.uploader.upload(fileBase64, {
      folder,
      resource_type: resourceType,
    });
    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    throw new Error("Upload failed: " + error.message);
  }
};

/**
 * Deletes a file from Cloudinary.
 * @param {string} publicId - Public ID of the file to delete.
 * @param {string} resourceType - Type of resource: "image", "video", or "raw" (default: "image").
 */
export const deleteImage = async (publicId, resourceType = "image") => {
  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
  } catch (error) {
    throw new Error("Deletion failed: " + error.message);
  }
};

export default cloudinary;