"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import { Check, X, Clock, Pencil } from "lucide-react";
import Loader from "@/components/ui/Loader";

const REFRESH_INTERVAL = 6000;

// CNIC: 5 digits - 7 digits - 1 digit (13 digits total, dashes auto-inserted)
function formatCNIC(value) {
  const digits = value.replace(/\D/g, "").slice(0, 13);
  if (digits.length <= 5) return digits;
  if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
}

function DetailField({ label, value }) {
  return (
    <div>
      <p className="text-xs font-medium text-[#5D8DC2] mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-[#1A1A1A] break-words">{value || "—"}</p>
    </div>
  );
}

export default function AdminVendorDetailPage() {
  const { vendorId } = useParams();
  const [vendor, setVendor] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");

  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ cnic: "", shopName: "", vendorName: "", email: "" });
  const editModeRef = useRef(editMode);
  editModeRef.current = editMode;

  const fetchData = useCallback(async (isBackground = false) => {
    try {
      const [vendorRes, productsRes] = await Promise.all([
        axios.get(`/api/vendors?id=${vendorId}`),
        axios.get(`/api/products?vendor=${vendorId}`),
      ]);
      if (!isBackground || !editModeRef.current) {
        setVendor(vendorRes.data.vendor);
      }
      setProducts(productsRes.data.products || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [vendorId]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleModeration = async (action) => {
    setActionLoading(action);
    try {
      const { data } = await axios.patch("/api/vendors", { vendorId, action });
      if (data.success) {
        setVendor(data.vendor);
        toast.success("Updated");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Action failed");
    } finally {
      setActionLoading("");
    }
  };

  const startEdit = () => {
    setForm({
      cnic: vendor.cnic || "",
      shopName: vendor.shopName || "",
      vendorName: vendor.vendorName || "",
      email: vendor.email || "",
    });
    setEditMode(true);
  };

  const saveEdit = async () => {
    if (form.cnic.replace(/\D/g, "").length !== 13) {
      toast.error("CNIC must be 13 digits");
      return;
    }
    setActionLoading("adminUpdate");
    try {
      const { data } = await axios.patch("/api/vendors", {
        vendorId,
        action: "adminUpdate",
        ...form,
      });
      if (data.success) {
        setVendor(data.vendor);
        setEditMode(false);
        toast.success("Vendor details updated");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Update failed");
    } finally {
      setActionLoading("");
    }
  };

  if (loading) return <Loader />;
  if (!vendor) return <p className="text-center py-12 text-sm font-medium text-[#1A1A1A]">Vendor not found.</p>;

  const hasPending =
    vendor.shopNameStatus === "pending" ||
    vendor.vendorNameStatus === "pending" ||
    vendor.emailStatus === "pending" ||
    vendor.cnicStatus === "pending";

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-xl font-bold text-[#1A1A1A]">{vendor.shopName}</h1>
        <span
          className={`text-xs font-bold px-3 py-1 rounded-full capitalize ${
            vendor.status === "active"
              ? "bg-green-100 text-green-700"
              : "bg-[#EC3237]/10 text-[#EC3237]"
          }`}
        >
          {vendor.status}
        </span>
      </div>

      {/* Details Card */}
      <div className="bg-white border border-[#C7D8EA] rounded-xl p-5 mb-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
          <DetailField label="Shop Name" value={vendor.shopName} />
          <DetailField label="Shop ID" value={vendor.shopId} />
          <DetailField label="Vendor Name" value={vendor.vendorName} />
          <DetailField label="Email" value={vendor.email} />
          <DetailField label="WhatsApp Number" value={vendor.whatsappNumber} />
          <DetailField label="CNIC" value={vendor.cnic} />
        </div>
      </div>

      {!editMode && (
        <button
          onClick={startEdit}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 mb-6 bg-[#C7D8EA]/50 text-[#1A1A1A] rounded-lg hover:bg-[#C7D8EA]"
        >
          <Pencil size={12} /> Edit Details
        </button>
      )}

      {editMode && (
        <div className="bg-[#C7D8EA]/20 border border-[#C7D8EA] rounded-xl p-4 mb-6 space-y-3">
          <div>
            <label className="text-xs font-medium text-[#5D8DC2] block mb-1">Shop Name</label>
            <input
              className="w-full border border-[#C7D8EA] bg-white rounded-lg px-3 py-2 text-sm font-medium text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#316EB2] focus:border-[#316EB2]"
              value={form.shopName}
              onChange={(e) => setForm({ ...form, shopName: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[#5D8DC2] block mb-1">Vendor (Person) Name</label>
            <input
              className="w-full border border-[#C7D8EA] bg-white rounded-lg px-3 py-2 text-sm font-medium text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#316EB2] focus:border-[#316EB2]"
              value={form.vendorName}
              onChange={(e) => setForm({ ...form, vendorName: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[#5D8DC2] block mb-1">Email</label>
            <input
              className="w-full border border-[#C7D8EA] bg-white rounded-lg px-3 py-2 text-sm font-medium text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#316EB2] focus:border-[#316EB2]"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[#5D8DC2] block mb-1">CNIC</label>
            <input
              inputMode="numeric"
              maxLength={15}
              placeholder="12345-1234567-1"
              className="w-full border border-[#C7D8EA] bg-white rounded-lg px-3 py-2 text-sm font-medium text-[#1A1A1A] placeholder-[#5D8DC2] focus:outline-none focus:ring-2 focus:ring-[#316EB2] focus:border-[#316EB2]"
              value={form.cnic}
              onChange={(e) => setForm({ ...form, cnic: formatCNIC(e.target.value) })}
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={saveEdit}
              disabled={actionLoading === "adminUpdate"}
              className="text-xs font-semibold px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              Save
            </button>
            <button
              onClick={() => setEditMode(false)}
              disabled={actionLoading === "adminUpdate"}
              className="text-xs font-semibold px-4 py-2 bg-[#C7D8EA]/60 text-[#1A1A1A] rounded-lg hover:bg-[#C7D8EA]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {hasPending && (
        <div className="bg-[#EC3237]/5 border border-[#EC3237]/30 rounded-xl p-4 mb-6 space-y-3">
          <p className="text-sm font-semibold text-[#EC3237] flex items-center gap-2">
            <Clock size={16} /> Pending Approval
          </p>

          {vendor.shopNameStatus === "pending" && (
            <div className="flex items-center justify-between text-sm font-medium text-[#1A1A1A]">
              <span>Shop name → <strong className="font-bold">{vendor.pendingShopName}</strong></span>
              <div className="flex gap-2">
                <button onClick={() => handleModeration("approveShopName")} disabled={actionLoading} className="p-1.5 bg-green-100 text-green-600 rounded">
                  <Check size={14} />
                </button>
                <button onClick={() => handleModeration("rejectShopName")} disabled={actionLoading} className="p-1.5 bg-[#EC3237]/10 text-[#EC3237] rounded">
                  <X size={14} />
                </button>
              </div>
            </div>
          )}

          {vendor.vendorNameStatus === "pending" && (
            <div className="flex items-center justify-between text-sm font-medium text-[#1A1A1A]">
              <span>Vendor name → <strong className="font-bold">{vendor.pendingVendorName}</strong></span>
              <div className="flex gap-2">
                <button onClick={() => handleModeration("approveVendorName")} disabled={actionLoading} className="p-1.5 bg-green-100 text-green-600 rounded">
                  <Check size={14} />
                </button>
                <button onClick={() => handleModeration("rejectVendorName")} disabled={actionLoading} className="p-1.5 bg-[#EC3237]/10 text-[#EC3237] rounded">
                  <X size={14} />
                </button>
              </div>
            </div>
          )}

          {vendor.emailStatus === "pending" && (
            <div className="flex items-center justify-between text-sm font-medium text-[#1A1A1A]">
              <span>Email → <strong className="font-bold">{vendor.pendingEmail}</strong></span>
              <div className="flex gap-2">
                <button onClick={() => handleModeration("approveEmail")} disabled={actionLoading} className="p-1.5 bg-green-100 text-green-600 rounded">
                  <Check size={14} />
                </button>
                <button onClick={() => handleModeration("rejectEmail")} disabled={actionLoading} className="p-1.5 bg-[#EC3237]/10 text-[#EC3237] rounded">
                  <X size={14} />
                </button>
              </div>
            </div>
          )}

          {vendor.cnicStatus === "pending" && (
            <div className="flex items-center justify-between text-sm font-medium text-[#1A1A1A]">
              <span>CNIC → <strong className="font-bold">{vendor.pendingCnic}</strong></span>
              <div className="flex gap-2">
                <button onClick={() => handleModeration("approveCnic")} disabled={actionLoading} className="p-1.5 bg-green-100 text-green-600 rounded">
                  <Check size={14} />
                </button>
                <button onClick={() => handleModeration("rejectCnic")} disabled={actionLoading} className="p-1.5 bg-[#EC3237]/10 text-[#EC3237] rounded">
                  <X size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <h2 className="text-sm font-bold text-[#1A1A1A] mb-3">
        Products ({products.length})
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map((product) => (
          <div key={product._id} className="bg-white border border-[#C7D8EA] rounded-xl overflow-hidden">
            <img src={product.images?.[0]?.url} alt={product.name} className="w-full h-32 object-cover" />
            <div className="p-3">
              <p className="text-sm font-semibold text-[#1A1A1A] line-clamp-2">{product.name}</p>
              <p className="text-sm font-bold text-[#1A1A1A]">Rs. {product.price?.toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}