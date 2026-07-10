"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import toast from "react-hot-toast";
import { Store, ArrowRight, Minus, Plus, Play } from "lucide-react";
import Button from "@/components/ui/Button";
import Loader from "@/components/ui/Loader";
import { getColorName } from "@/utils/colorNames";

export default function ProductPage() {
  const { productId } = useParams();
  const router = useRouter();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data } = await axios.get(`/api/products?id=${productId}`);
        if (data.success) setProduct(data.product);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [productId]);

  const needsSize = product?.sizePool?.length > 0;
  const needsColor = product?.colorPool?.length > 0;
  const canOrder = (!needsSize || selectedSize) && (!needsColor || selectedColor);

  // Use product.stock if the schema provides it, otherwise fall back to a sane cap
  const maxQuantity =
    typeof product?.stock === "number" && product.stock > 0 ? product.stock : 10;

  const decreaseQty = () => setQuantity((q) => Math.max(1, q - 1));
  const increaseQty = () => setQuantity((q) => Math.min(maxQuantity, q + 1));

  const handleQtyInput = (e) => {
    const val = parseInt(e.target.value, 10);
    if (isNaN(val)) {
      setQuantity(1);
      return;
    }
    setQuantity(Math.min(maxQuantity, Math.max(1, val)));
  };

  const handleBuyNow = () => {
    if (!canOrder) {
      toast.error("Please select size and color");
      return;
    }
    const params = new URLSearchParams({
      productId: product._id,
      quantity: String(quantity),
    });
    if (selectedSize) params.set("size", selectedSize);
    if (selectedColor) params.set("color", selectedColor);
    router.push(`/checkout?${params.toString()}`);
  };

  if (loading) return <Loader />;
  if (!product) return <p className="text-center py-12 text-[#1A1A1A]">Product not found.</p>;

  return (
    <div className="bg-white min-h-screen">
      <div className="grid md:grid-cols-2 gap-10 max-w-6xl mx-auto p-4 md:p-8">
        {/* LEFT: Images */}
        <div>
          <div className="aspect-square overflow-hidden bg-white border border-[#C7D8EA] rounded-lg mb-4 shadow-sm">
            {showVideo && product.video?.url ? (
              <video
                key={product.video.url}
                src={product.video.url}
                controls
                autoPlay
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                src={product.images?.[activeImage]?.url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            )}
          </div>

          <div className="flex gap-2 flex-wrap">
            {product.images?.map((img, idx) => (
              <button
                key={img.publicId}
                onClick={() => {
                  setShowVideo(false);
                  setActiveImage(idx);
                }}
                className={`w-16 h-16 overflow-hidden rounded-md border-2 transition-colors ${
                  !showVideo && idx === activeImage ? "border-[#EC3237]" : "border-[#C7D8EA]"
                }`}
              >
                <img src={img.url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}

            {/* Video thumbnail, part of the same row */}
            {product.video?.url && (
              <button
                onClick={() => setShowVideo(true)}
                className={`relative w-16 h-16 overflow-hidden rounded-md border-2 bg-[#1A1A1A] transition-colors ${
                  showVideo ? "border-[#EC3237]" : "border-[#C7D8EA]"
                }`}
              >
                {product.video.thumbnailUrl ? (
                  <img
                    src={product.video.thumbnailUrl}
                    alt="Product video"
                    className="w-full h-full object-cover opacity-70"
                  />
                ) : (
                  <div className="w-full h-full bg-[#1A1A1A]" />
                )}
                <span className="absolute inset-0 flex items-center justify-center">
                  <Play size={18} className="text-white fill-white" />
                </span>
              </button>
            )}
          </div>
        </div>

        {/* RIGHT: Details */}
        <div className="flex flex-col h-full border border-[#C7D8EA] rounded-xl overflow-hidden">
          {/* SECTION 1: product info */}
          <div className="p-4 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              {product.vendor?._id ? (
                <Link
                  href={`/vendor/${product.vendor._id}`}
                  className="text-xs text-[#316EB2] font-semibold hover:underline inline-flex items-center gap-1"
                >
                  <Store size={12} />
                  {product.vendor.shopName}
                </Link>
              ) : (
                <p className="text-xs text-[#316EB2] font-semibold inline-flex items-center gap-1">
                  <Store size={12} />
                  {product.vendor?.shopName}
                </p>
              )}

              {product.category?.name && (
                <span className="text-[10px] uppercase tracking-wide font-semibold text-[#316EB2] bg-[#C7D8EA]/50 px-2.5 py-0.5 rounded-full">
                  {product.category.name}
                </span>
              )}
            </div>

            <h1 className="text-lg font-bold text-[#1A1A1A] leading-snug line-clamp-2">
              {product.name}
            </h1>

            <div className="inline-flex items-baseline gap-1.5 bg-[#EC3237]/10 border border-[#EC3237]/20 px-3 py-1 w-fit rounded-lg">
              <span className="text-[10px] font-medium text-[#EC3237]/80">Rs.</span>
              <span className="text-lg font-extrabold text-[#EC3237]">
                {product.price?.toLocaleString()}
              </span>
            </div>

            {product.description && (
              <div>
                <p className="text-[10px] font-semibold text-[#316EB2] uppercase tracking-wide mb-1">
                  Description
                </p>
                <p className="text-[#333] leading-snug text-xs line-clamp-3">
                  {product.description}
                </p>
              </div>
            )}

            {needsSize && (
              <div>
                <p className="text-xs font-semibold text-[#1A1A1A] mb-1.5">
                  Select Size {!selectedSize && <span className="text-[#EC3237]">*</span>}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {product.sizePool.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-3 py-1 border rounded-md text-xs font-medium transition-colors bg-white ${
                        selectedSize === size
                          ? "border-[#EC3237] bg-[#EC3237]/10 text-[#EC3237]"
                          : "border-[#C7D8EA] text-[#333] hover:bg-[#C7D8EA]/30"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {needsColor && (
              <div>
                <p className="text-xs font-semibold text-[#1A1A1A] mb-1.5">
                  Select Color {!selectedColor && <span className="text-[#EC3237]">*</span>}
                  {selectedColor && (
                    <span className="ml-1 text-[#5D8DC2] font-normal">
                      — {getColorName(selectedColor)}
                    </span>
                  )}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {product.colorPool.map((hex) => (
                    <button
                      key={hex}
                      title={getColorName(hex)}
                      onClick={() => setSelectedColor(hex)}
                      className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${
                        selectedColor === hex
                          ? "ring-2 ring-offset-1 ring-[#EC3237] border-transparent"
                          : "border-[#C7D8EA]"
                      }`}
                      style={{ background: hex }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Divider between the two sections */}
          <div className="border-t border-[#C7D8EA]" />

          {/* SECTION 2: quantity, buy, shop */}
          <div className="p-4 flex flex-col gap-2.5 flex-1">
            <p className="text-xs font-semibold text-[#1A1A1A]">Quantity</p>
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center border border-[#C7D8EA] overflow-hidden bg-[#F7FAFD] rounded-md">
                <button
                  type="button"
                  onClick={decreaseQty}
                  disabled={quantity <= 1}
                  className="w-8 h-8 flex items-center justify-center text-[#316EB2] hover:bg-[#C7D8EA]/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Minus size={14} />
                </button>
                <input
                  type="text"
                  inputMode="numeric"
                  value={quantity}
                  onChange={handleQtyInput}
                  className="w-10 h-8 text-center text-xs font-semibold text-[#1A1A1A] border-x border-[#C7D8EA] bg-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={increaseQty}
                  disabled={quantity >= maxQuantity}
                  className="w-8 h-8 flex items-center justify-center text-[#316EB2] hover:bg-[#C7D8EA]/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus size={14} />
                </button>
              </div>

              {typeof product?.stock === "number" && (
                <span
                  className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${
                    product.stock > 0
                      ? "text-[#1F8A4C] bg-[#1F8A4C]/10"
                      : "text-[#EC3237] bg-[#EC3237]/10"
                  }`}
                >
                  {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
                </span>
              )}
            </div>

            <Button
              onClick={handleBuyNow}
              className="w-full !bg-[#EC3237] hover:!bg-[#d92b30] !text-white font-semibold !py-2 !rounded-lg shadow-md"
            >
              Buy Now
            </Button>

            {product.vendor?._id && (
              <div className="mt-auto pt-2.5 border-t border-[#C7D8EA]">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-8 h-8 flex items-center justify-center bg-[#316EB2]/10 border border-[#C7D8EA] shrink-0 rounded-md">
                    <Store size={15} className="text-[#316EB2]" />
                  </div>
                  <div>
                    <p className="text-[10px] text-[#5D8DC2] uppercase tracking-wide font-medium">
                      Sold by
                    </p>
                    <p className="text-xs font-bold text-[#1A1A1A]">
                      {product.vendor.shopName}
                    </p>
                  </div>
                </div>
                <Link
                  href={`/vendor/${product.vendor._id}`}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#316EB2] hover:bg-[#285a91] text-white text-xs font-semibold transition-colors shadow-sm rounded-md"
                >
                  View More Products from this Shop
                  <ArrowRight size={14} />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}