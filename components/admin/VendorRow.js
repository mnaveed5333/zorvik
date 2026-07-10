"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import { Clock } from "lucide-react";

export default function VendorRow({ vendor, onUpdate }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const hasPendingRequest =
    vendor.shopNameStatus === "pending" ||
    vendor.vendorNameStatus === "pending" ||
    vendor.emailStatus === "pending";

  const goToDetail = () => {
    router.push(`/admin/vendors/${vendor._id}`);
  };

  const handleSuspend = async (e, action) => {
    e.stopPropagation();
    setLoading(true);
    try {
      const { data } = await axios.patch("/api/vendors", { vendorId: vendor._id, action });
      if (data.success) {
        toast.success(action === "suspend" ? "Vendor suspended" : "Vendor reactivated");
        onUpdate?.();
      } else {
        toast.error(data.message || "Action failed");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Action failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <tr
      onClick={goToDetail}
      className="border-b border-[#C7D8EA] cursor-pointer hover:bg-[#C7D8EA]/30 transition-colors"
    >
      <td className="py-3 px-4">
        <span className="font-bold text-[#1A1A1A] flex items-center gap-2">
          {vendor.shopName}
          {hasPendingRequest && (
            <span
              title="Has a pending change request"
              className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#EC3237]/10 text-[#EC3237]"
            >
              <Clock size={10} /> Pending
            </span>
          )}
        </span>
      </td>
      <td className="py-3 px-4 text-xs font-mono font-medium text-[#1A1A1A]">{vendor.shopId}</td>
      <td className="py-3 px-4 text-sm font-medium text-[#1A1A1A]">{vendor.email}</td>
      <td className="py-3 px-4 text-sm font-medium text-[#1A1A1A]">{vendor.whatsappNumber}</td>
      <td className="py-3 px-4">
        <span
          className={`text-xs font-bold px-3 py-1 rounded-full capitalize ${
            vendor.status === "active"
              ? "bg-green-100 text-green-700"
              : "bg-[#EC3237]/10 text-[#EC3237]"
          }`}
        >
          {vendor.status}
        </span>
      </td>
      <td className="py-3 px-4 text-right">
        <button
          disabled={loading}
          onClick={(e) => handleSuspend(e, vendor.status === "active" ? "suspend" : "reactivate")}
          className={`text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50 ${
            vendor.status === "active"
              ? "bg-[#EC3237]/10 text-[#EC3237] hover:bg-[#EC3237]/20"
              : "bg-green-100 text-green-700 hover:bg-green-200"
          }`}
        >
          {loading ? "..." : vendor.status === "active" ? "Suspend" : "Reactivate"}
        </button>
      </td>
    </tr>
  );
}