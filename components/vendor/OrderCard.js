"use client";

import { useState, useRef } from "react";
import { MessageCircle, CheckCircle2, XCircle, ChevronDown, Printer } from "lucide-react";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";
import { buildCustomerContactLink } from "@/utils/whatsappHelper";
import { getColorName } from "@/utils/colorNames";

const statusStyles = {
  placed: "bg-[#EC3237]/10 text-[#EC3237]",
  seen: "bg-[#316EB2]/10 text-[#316EB2]",
  confirmed: "bg-green-100 text-green-700",
};

export default function OrderCard({ order, vendor, onConfirm, onUnconfirm }) {
  const [expanded, setExpanded] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const receiptRef = useRef(null);
  const whatsappLink = buildCustomerContactLink(order.customerWhatsapp, order);

  const isConfirmed = order.status === "confirmed";

  const handlePrint = async () => {
    setDownloading(true);
    try {
      const canvas = await html2canvas(receiptRef.current, {
        useCORS: true,
        backgroundColor: "#ffffff",
        scale: 2,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdfWidth = 105;
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: [pdfWidth, pdfHeight] });
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`receipt-${order.orderId}.pdf`);
    } catch (error) {
      console.error(error);
    } finally {
      setDownloading(false);
    }
  };

  const handleToggleConfirm = () => {
    if (isConfirmed) {
      onUnconfirm?.(order._id);
    } else {
      onConfirm?.(order._id);
    }
  };

  return (
    <div className="bg-white border border-[#C7D8EA] rounded-xl mb-4 overflow-hidden">
      <button
        onClick={() => setExpanded((prev) => !prev)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-4 min-w-0">
          <ChevronDown
            size={18}
            className={`shrink-0 text-[#5D8DC2] transition-transform ${expanded ? "rotate-180" : ""}`}
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#1A1A1A] truncate">Order #{order.orderId}</p>
            <p className="text-xs text-[#5D8DC2] truncate">
              {order.customerName} · {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="font-bold text-sm text-[#1A1A1A]">Rs. {order.totalAmount.toLocaleString()}</span>
          <span className={`text-xs font-medium px-3 py-1 rounded-full capitalize ${statusStyles[order.status]}`}>
            {order.status}
          </span>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-[#C7D8EA] pt-4">
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div className="bg-[#C7D8EA]/20 rounded-lg p-3">
              <p className="text-xs font-semibold text-[#5D8DC2] uppercase mb-1">Customer</p>
              <p className="text-sm font-semibold text-[#1A1A1A]">{order.customerName}</p>
              <p className="text-xs text-[#5D8DC2]">{order.customerWhatsapp}</p>
            </div>

            <div className="bg-[#C7D8EA]/20 rounded-lg p-3">
              <p className="text-xs font-semibold text-[#5D8DC2] uppercase mb-1">Order Info</p>
              <p className="text-sm text-[#1A1A1A]">Date: {new Date(order.createdAt).toLocaleDateString()}</p>
              <p className="text-sm text-[#1A1A1A]">Time: {new Date(order.createdAt).toLocaleTimeString()}</p>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-xs font-semibold text-[#5D8DC2] uppercase mb-2">Items</p>
            <div className="space-y-2">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm text-[#1A1A1A] bg-[#C7D8EA]/20 rounded-lg px-3 py-2">
                  <span>
                    {item.name}
                    {item.variant?.size ? ` · ${item.variant.size}` : ""}
                    {item.variant?.color ? ` · ${getColorName(item.variant.color)}` : ""} × {item.quantity}
                  </span>
                  <span>Rs. {(item.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-[#C7D8EA] pt-3">
            <div>
              <p className="font-bold text-[#1A1A1A]">Total: Rs. {order.totalAmount.toLocaleString()}</p>
              <p className="text-[11px] text-[#5D8DC2]">Delivery charges not included — paid by customer separately</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleConfirm}
                className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg text-white ${
                  isConfirmed
                    ? "bg-[#5D8DC2] hover:bg-[#4a76a8]"
                    : "bg-[#EC3237] hover:bg-[#d42a2f]"
                }`}
              >
                {isConfirmed ? <XCircle size={14} /> : <CheckCircle2 size={14} />}
                {isConfirmed ? "Unconfirm" : "Confirm"}
              </button>

              <button
                onClick={handlePrint}
                disabled={downloading}
                className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-[#316EB2] text-white hover:bg-[#28588f] disabled:opacity-40"
              >
                <Printer size={14} />
                {downloading ? "Downloading..." : "Print Receipt"}
              </button>
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-[#5D8DC2] text-white hover:bg-[#4a76a8]"
              >
                <MessageCircle size={14} />
                Message Customer
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Hidden receipt template — always renders on white for print output */}
      <div className="fixed -left-[9999px] top-0">
        <div
          ref={receiptRef}
          className="relative w-[380px] bg-white p-6 text-black font-bold overflow-hidden"
          style={{ fontFamily: "'Courier New', monospace" }}
        >
    <div
  className="absolute pointer-events-none text-center"
  style={{
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%) rotate(-30deg)",
    fontSize: "30px",
    fontWeight: 1000,
    border: "4px solid rgba(236, 50, 55, 0.55)",
    outline: "1.5px solid rgba(236, 50, 55, 0.55)",
    outlineOffset: "3px",
    borderRadius: "10px",
    padding: "8px 16px",
    letterSpacing: "1.5px",
    lineHeight: 1.4,
    whiteSpace: "nowrap",
    zIndex: 50,
    overflow: "hidden",
    backgroundImage:
      "repeating-linear-gradient(45deg, rgba(236, 50, 55, 0.15) 0px, rgba(236, 50, 55, 0.15) 1px, transparent 1px, transparent 6px)",
  }}
>
  <span style={{ position: "relative", zIndex: 1, color: "rgba(236, 50, 55, 0.4)" }}>
    PRODUCT BILL PAID
  </span>
</div>

          <div className="text-center mb-4">
            <p className="text-2xl font-bold tracking-wide text-black">Zorvik</p>
            <p className="text-[10px] text-black font-bold">Multi-Vendor Marketplace</p>
          </div>

          <div className="border-t-2 border-dashed border-black my-3" />

          <div className="text-xs space-y-0.5 mb-3 text-black">
            <div className="flex justify-between"><span>Order ID:</span><span>{order.orderId}</span></div>
            <div className="flex justify-between"><span>Order Date:</span><span>{new Date(order.createdAt).toLocaleDateString()}</span></div>
            <div className="flex justify-between"><span>Order Time:</span><span>{new Date(order.createdAt).toLocaleTimeString()}</span></div>
            <div className="flex justify-between"><span>Receipt Date:</span><span>{new Date().toLocaleDateString()}</span></div>
            <div className="flex justify-between"><span>Receipt Time:</span><span>{new Date().toLocaleTimeString()}</span></div>
          </div>

          <div className="border-t-2 border-dashed border-black my-3" />

          <div className="mb-3 text-black">
            <p className="text-xs uppercase tracking-wide mb-1.5">Vendor Details</p>
            <div className="text-xs space-y-0.5">
              <div className="flex justify-between"><span>Shop Name:</span><span>{vendor?.shopName || "-"}</span></div>
              {vendor?.shopId && (
                <div className="flex justify-between"><span>Shop ID:</span><span>{vendor.shopId}</span></div>
              )}
              <div className="flex justify-between"><span>WhatsApp:</span><span>{vendor?.whatsappNumber || order.vendorWhatsapp || "-"}</span></div>
            </div>
          </div>

          <div className="border-t-2 border-dashed border-black my-3" />

          <div className="mb-3 text-black">
            <p className="text-xs uppercase tracking-wide mb-1.5">Customer Details</p>
            <div className="text-xs space-y-0.5">
              <div className="flex justify-between"><span>Name:</span><span>{order.customerName || "-"}</span></div>
              <div className="flex justify-between"><span>WhatsApp:</span><span>{order.customerWhatsapp || "-"}</span></div>
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
              {order.items.map((item, idx) => (
                <div key={idx} className="border-b border-dotted border-black py-1">
                  <div className="flex justify-between">
                    <span className="w-[46%] leading-tight">{item.name}</span>
                    <span className="w-[20%] text-center">{item.price?.toLocaleString()}</span>
                    <span className="w-[14%] text-center">{item.quantity}</span>
                    <span className="w-[20%] text-right">{(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                  {(item.variant?.size || item.variant?.color) && (
                    <div className="text-[10px] pl-1">
                      {item.variant?.size && <span>Size: {item.variant.size}</span>}
                      {item.variant?.size && item.variant?.color && <span> · </span>}
                      {item.variant?.color && <span>Color: {getColorName(item.variant.color)}</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="border-t-2 border-dashed border-black my-3" />

          <div className="text-xs space-y-1 text-black">
            <div className="flex justify-between"><span>Subtotal</span><span>Rs. {order.totalAmount.toLocaleString()}</span></div>
            <div className="flex justify-between text-base pt-1 border-t border-black mt-1">
              <span>TOTAL</span><span>Rs. {order.totalAmount.toLocaleString()}</span>
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
  );
}