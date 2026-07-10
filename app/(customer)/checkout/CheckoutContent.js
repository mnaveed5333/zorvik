"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Loader from "@/components/ui/Loader";
import { buildWhatsappLink } from "@/utils/whatsappHelper";
import { getColorName } from "@/utils/colorNames";
import { generateOrderId } from "@/utils/generateOrderId";

export default function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const receiptRef = useRef(null);

  const productId = searchParams.get("productId");
  const size = searchParams.get("size") || "";
  const color = searchParams.get("color") || "";

  const initialQuantity = (() => {
    const parsed = parseInt(searchParams.get("quantity"), 10);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
  })();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(initialQuantity);
  const [name, setName] = useState("");
  const [whatsappLocal, setWhatsappLocal] = useState("");
  const [placingOrder, setPlacingOrder] = useState(false);

  const [orderId] = useState(() => generateOrderId());

  const isWhatsappValid =
    whatsappLocal.length === 10 || (whatsappLocal.length === 11 && whatsappLocal.startsWith("0"));

  const normalizedWhatsappLocal =
    whatsappLocal.length === 11 && whatsappLocal.startsWith("0")
      ? whatsappLocal.slice(1)
      : whatsappLocal;

  const whatsapp = `92${normalizedWhatsappLocal}`;

  useEffect(() => {
    if (!productId) {
      setLoading(false);
      return;
    }
    const fetchProduct = async () => {
      try {
        const { data } = await axios.get(`/api/products?id=${productId}`);
        if (data.success) {
          setProduct(data.product);
          if (typeof data.product.stock === "number" && data.product.stock > 0) {
            setQuantity((q) => Math.min(q, data.product.stock));
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [productId]);

  const maxQuantity =
    typeof product?.stock === "number" && product.stock > 0 ? product.stock : Infinity;

  const total = product ? product.price * quantity : 0;

  const handleWhatsappChange = (e) => {
    const raw = e.target.value.replace(/\D/g, "");
    const max = raw.startsWith("0") ? 11 : 10;
    setWhatsappLocal(raw.slice(0, max));
  };

  const downloadReceipt = async () => {
    const canvas = await html2canvas(receiptRef.current, {
      useCORS: true,
      backgroundColor: "#ffffff",
      scale: 2,
    });

    const imgData = canvas.toDataURL("image/png");

    const pdfWidth = 105;
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [pdfWidth, pdfHeight],
    });

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`receipt-${orderId}.pdf`);
  };

  const handleOrderOnWhatsapp = async () => {
    if (!name.trim()) {
      toast.error("Enter your name first");
      return;
    }
    if (!isWhatsappValid) {
      toast.error("Enter 10 digits, or 11 digits starting with 0");
      return;
    }

    setPlacingOrder(true);
    try {
      const items = [
        {
          product: product._id,
          name: product.name,
          price: product.price,
          quantity,
          variant: { size, color },
        },
      ];

      const { data } = await axios.post("/api/orders", {
        orderId,
        customerName: name,
        customerWhatsapp: whatsapp,
        subOrders: [
          {
            vendorId: product.vendor._id,
            vendorWhatsapp: product.vendor.whatsappNumber,
            items,
            totalAmount: total,
          },
        ],
      });

      if (data.success) {
        try {
          await downloadReceipt();
        } catch (receiptError) {
          console.error(receiptError);
          toast.error("Order placed, but receipt download failed");
        }

        const link = buildWhatsappLink(product.vendor.whatsappNumber, {
          orderId,
          items,
          customerName: name,
          customerWhatsapp: whatsapp,
          totalAmount: total,
        });
        window.open(link, "_blank");
        toast.success("Receipt downloaded — attach it in WhatsApp and send");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to place order");
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loading) return <Loader />;
  if (!product) return <p className="text-center py-16 text-[#5D8DC2]">Product not found.</p>;

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-md mx-auto px-4 py-8">
        <h1 className="text-xl font-bold text-[#1A1A1A] mb-6">Checkout</h1>

        <div className="bg-white border border-[#C7D8EA] rounded-xl p-5 mb-4">
          <p className="text-sm font-semibold text-[#316EB2] mb-3">
            {product.vendor?.shopName}
          </p>
          <div className="flex items-center gap-3 mb-4">
            <img src={product.images?.[0]?.url} alt={product.name} className="w-16 h-16 object-cover rounded-lg border border-[#C7D8EA]" />
            <div className="flex-1">
              <p className="font-medium text-[#1A1A1A]">{product.name}</p>
              <p className="text-sm text-[#5D8DC2]">{product.description}</p>
            </div>
          </div>

          <div className="space-y-1.5 text-sm text-[#333] mb-4">
            {size && <p>Size: <span className="font-medium text-[#1A1A1A]">{size}</span></p>}
            {color && (
              <p className="flex items-center gap-1.5">
                Color:
                <span className="w-3.5 h-3.5 rounded-full border border-[#C7D8EA]" style={{ background: color }} />
                {getColorName(color)}
              </p>
            )}
            <div className="flex items-center gap-2 pt-1">
              <span>Quantity:</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                className="w-7 h-7 rounded-lg border border-[#C7D8EA] text-[#316EB2] hover:bg-[#C7D8EA]/20 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                −
              </button>
              <span className="w-6 text-center text-[#1A1A1A]">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
                disabled={quantity >= maxQuantity}
                className="w-7 h-7 rounded-lg border border-[#C7D8EA] text-[#316EB2] hover:bg-[#C7D8EA]/20 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                +
              </button>
            </div>
          </div>

          <div className="flex justify-between border-t border-[#C7D8EA] pt-3">
            <p className="font-bold text-[#1A1A1A]">Total</p>
            <p className="font-bold text-[#1A1A1A]">Rs. {total.toLocaleString()}</p>
          </div>
          <p className="text-[11px] text-[#5D8DC2] mt-1">
            Delivery charges are not included — paid separately by you to the vendor.
          </p>
        </div>

        <div className="bg-white border border-[#C7D8EA] rounded-xl p-5 mb-4">
          <Input
            label="Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Ali Khan"
            required
          />

          <div className="mb-1">
            <label className="text-sm text-[#333] block mb-1">
              Your WhatsApp Number <span className="text-[#EC3237]">*</span>
            </label>
            <div className="flex items-center border border-[#C7D8EA] rounded-lg overflow-hidden bg-white">
              <span className="px-3 py-2 text-sm font-medium text-[#5D8DC2] bg-[#C7D8EA]/20 border-r border-[#C7D8EA] select-none">
                92
              </span>
              <input
                type="tel"
                inputMode="numeric"
                value={whatsappLocal}
                onChange={handleWhatsappChange}
                placeholder="3001234567 or 03001234567"
                maxLength={11}
                className="flex-1 px-3 py-2 text-sm bg-transparent text-[#1A1A1A] outline-none"
              />
            </div>
            <p className="text-xs mt-1 text-[#5D8DC2]">
              Enter 10 digits, or 11 digits starting with 0
            </p>
          </div>
        </div>

        <Button
          onClick={handleOrderOnWhatsapp}
          disabled={placingOrder}
          className="w-full bg-[#EC3237] hover:bg-[#d42a2f] text-white disabled:opacity-40"
        >
          {placingOrder ? "Processing..." : "Order via WhatsApp"}
        </Button>

        <p className="text-xs text-center text-[#5D8DC2] mt-2">
          Your receipt will download automatically — attach it in WhatsApp before sending
        </p>

        <div className="fixed -left-[9999px] top-0">
          <div
            ref={receiptRef}
            className="relative w-[380px] bg-white p-6 text-black font-bold overflow-hidden"
            style={{ fontFamily: "'Courier New', monospace" }}
          >
            <div className="text-center mb-4">
              <p className="text-2xl font-bold tracking-wide text-black">Zorvik</p>
              <p className="text-[10px] text-black font-bold">Multi-Vendor Marketplace</p>
            </div>

            <div className="border-t-2 border-dashed border-black my-3" />

            <div className="text-xs space-y-0.5 mb-3 text-black">
              <div className="flex justify-between">
                <span>Order ID:</span>
                <span>{orderId}</span>
              </div>
              <div className="flex justify-between">
                <span>Date:</span>
                <span>{new Date().toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Time:</span>
                <span>{new Date().toLocaleTimeString()}</span>
              </div>
            </div>

            <div className="border-t-2 border-dashed border-black my-3" />

            <div className="mb-3 text-black">
              <p className="text-xs uppercase tracking-wide mb-1.5">Vendor Details</p>
              <div className="text-xs space-y-0.5">
                <div className="flex justify-between">
                  <span>Shop Name:</span>
                  <span>{product.vendor?.shopName || "-"}</span>
                </div>
                {product.vendor?.shopId && (
                  <div className="flex justify-between">
                    <span>Shop ID:</span>
                    <span>{product.vendor.shopId}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>WhatsApp:</span>
                  <span>{product.vendor?.whatsappNumber || "-"}</span>
                </div>
              </div>
            </div>

            <div className="border-t-2 border-dashed border-black my-3" />

            <div className="mb-3 text-black">
              <p className="text-xs uppercase tracking-wide mb-1.5">Customer Details</p>
              <div className="text-xs space-y-0.5">
                <div className="flex justify-between">
                  <span>Name:</span>
                  <span>{name || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span>WhatsApp:</span>
                  <span>{whatsapp}</span>
                </div>
              </div>
            </div>

            <div className="border-t-2 border-dashed border-black my-3" />

            <div className="mb-3 text-black">
              <p className="text-xs uppercase tracking-wide mb-1.5">Product Details</p>
              <div className="text-[11px]">
                <div className="flex justify-between border-b border-black pb-1 mb-1">
                  <span className="w-[46%]">ITEM</span>
                  <span className="w-[20%] text-center">PRICE</span>
                  <span className="w-[14%] text-center">QTY</span>
                  <span className="w-[20%] text-right">TOTAL</span>
                </div>

                <div className="flex justify-between py-1 border-b border-dotted border-black">
                  <span className="w-[46%] leading-tight">{product.name}</span>
                  <span className="w-[20%] text-center">{product.price?.toLocaleString()}</span>
                  <span className="w-[14%] text-center">{quantity}</span>
                  <span className="w-[20%] text-right">{total.toLocaleString()}</span>
                </div>

                {(size || color) && (
                  <div className="text-[10px] pl-1 pb-1 border-b border-dotted border-black">
                    {size && <span>Size: {size}</span>}
                    {size && color && <span> · </span>}
                    {color && <span>Color: {getColorName(color)}</span>}
                  </div>
                )}
              </div>
            </div>

            <div className="border-t-2 border-dashed border-black my-3" />

            <div className="text-xs space-y-1 text-black">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>Rs. {total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-base pt-1 border-t border-black mt-1">
                <span>TOTAL</span>
                <span>Rs. {total.toLocaleString()}</span>
              </div>
            </div>

            <div className="border-t border-black my-2" />

            <div className="text-[9px] text-center text-black leading-snug">
              <p>* Delivery charges are NOT included in the total above.</p>
              <p>* Delivery charges will be paid by the customer separately.</p>
            </div>

            <div className="border-t-2 border-dashed border-black my-3" />

            <div className="text-center text-[10px] text-black mt-3">
              <p>Thank you for your order!</p>
              <p>This is a computer generated receipt.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}