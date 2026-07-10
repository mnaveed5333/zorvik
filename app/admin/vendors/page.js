"use client";

import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { Search, ArrowUpDown } from "lucide-react";
import VendorRow from "@/components/admin/VendorRow";
import Loader from "@/components/ui/Loader";

const STATUS_OPTIONS = [
  { value: "all", label: "All Vendors" },
  { value: "active", label: "Active Vendors" },
  { value: "suspended", label: "Suspended Vendors" },
];

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchVendors = async () => {
    try {
      const { data } = await axios.get("/api/vendors");
      if (data.success) setVendors(data.vendors);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const filteredVendors = useMemo(() => {
    const q = search.trim().toLowerCase();

    return vendors.filter((v) => {
      const matchesStatus = statusFilter === "all" || v.status === statusFilter;
      if (!matchesStatus) return false;

      if (!q) return true;
      return (
        v.shopName?.toLowerCase().includes(q) ||
        v.vendorName?.toLowerCase().includes(q) ||
        v.shopId?.toLowerCase().includes(q) ||
        v.email?.toLowerCase().includes(q)
      );
    });
  }, [vendors, search, statusFilter]);

  if (loading) return <Loader />;

  return (
    <div>
      <h1 className="text-xl font-bold text-[#1A1A1A] mb-6">Vendors</h1>

      {/* Controls: Dropdown (right, left of search bar) + Search (right) */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-end gap-3 mb-6">
        {/* Status Dropdown (Right, left of search bar) */}
        <div className="relative w-full md:w-56">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full appearance-none pl-3 pr-9 py-2 rounded-lg border border-[#C7D8EA] bg-white text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#316EB2] focus:border-[#316EB2] cursor-pointer"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ArrowUpDown
            size={14}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5D8DC2] pointer-events-none"
          />
        </div>

        {/* Search Bar (Right) - Extended by 140px */}
        <div className="relative w-full md:w-[320px]">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5D8DC2]"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, shop ID, shop name, email..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-[#C7D8EA] bg-white text-[#1A1A1A] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#316EB2] focus:border-[#316EB2]"
          />
        </div>
      </div>

      <div className="bg-white border border-[#C7D8EA] rounded-xl overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[#C7D8EA] text-sm font-semibold text-[#1A1A1A]">
              <th className="py-3 px-4">Shop Name</th>
              <th className="py-3 px-4">Shop ID</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">WhatsApp</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredVendors.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-sm font-medium text-[#1A1A1A]">
                  No vendors match your search.
                </td>
              </tr>
            ) : (
              filteredVendors.map((vendor) => (
                <VendorRow key={vendor._id} vendor={vendor} onUpdate={fetchVendors} />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}