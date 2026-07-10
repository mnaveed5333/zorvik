"use client";

import { MessageCircle } from "lucide-react";
import { buildCustomerContactLink, buildVendorContactLink } from "@/utils/whatsappHelper";

export default function OrderRow({ order }) {
  const customerLink = buildCustomerContactLink(order.customerWhatsapp, order);
  const vendorLink = buildVendorContactLink(order.vendorWhatsapp, order);

  return (
    <tr className="border-b border-[#C7D8EA]">
      <td className="py-3 px-4 text-sm font-semibold text-[#1A1A1A]">
        #{order.orderId}
      </td>

      <td className="py-3 px-4 text-sm text-[#1A1A1A]">
        <p className="font-semibold text-[#1A1A1A]">{order.customerName}</p>
        <p className="text-xs font-medium text-[#1A1A1A]">{order.customerWhatsapp}</p>
      </td>

      <td className="py-3 px-4 text-sm text-[#1A1A1A]">
        <p className="font-semibold text-[#1A1A1A]">{order.vendor?.shopName}</p>
        <p className="text-xs font-medium text-[#1A1A1A]">{order.vendorWhatsapp}</p>
      </td>

      <td className="py-3 px-4 text-xs font-mono font-medium text-[#1A1A1A]">
        {order.vendor?.shopId || "—"}
      </td>

      <td className="py-3 px-4 text-sm font-bold text-[#1A1A1A]">
        Rs. {order.totalAmount.toLocaleString()}
      </td>

      <td className="py-3 px-4 text-sm font-medium text-[#1A1A1A]">
        {new Date(order.createdAt).toLocaleDateString()}
      </td>

      <td className="py-3 px-4">
        <div className="flex gap-2">
          <a
            href={customerLink}
            target="_blank"
            rel="noopener noreferrer"
            title="Message Customer"
            className="flex items-center gap-1 text-xs px-2 py-1.5 rounded-lg bg-[#5D8DC2] text-white hover:opacity-90"
          >
            <MessageCircle size={14} />
          </a>
          <a
            href={vendorLink}
            target="_blank"
            rel="noopener noreferrer"
            title="Message Vendor"
            className="flex items-center gap-1 text-xs px-2 py-1.5 rounded-lg bg-[#316EB2] text-white hover:opacity-90"
          >
            <MessageCircle size={14} />
          </a>
        </div>
      </td>
    </tr>
  );
}