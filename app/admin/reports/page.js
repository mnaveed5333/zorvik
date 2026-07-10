"use client";

import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { ArrowUpDown, Search } from "lucide-react";
import Loader from "@/components/ui/Loader";

const SORT_OPTIONS = [
  { value: "revenue-high", label: "Highest Expected Revenue" },
  { value: "revenue-low", label: "Lowest Expected Revenue" },
  { value: "orders-high", label: "Most Orders" },
  { value: "orders-low", label: "Least Orders" },
];

export default function AdminReportsPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("revenue-high");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data } = await axios.get("/api/orders");
        if (data.success) setOrders(data.orders);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const totalExpectedRevenue = useMemo(
    () => orders.reduce((sum, o) => sum + o.totalAmount, 0),
    [orders]
  );

  const vendorStats = useMemo(() => {
    const grouped = orders.reduce((acc, o) => {
      const key = o.vendor?.shopName || "Unknown";
      if (!acc[key]) acc[key] = { vendorName: key, revenue: 0, orderCount: 0 };
      acc[key].revenue += o.totalAmount;
      acc[key].orderCount += 1;
      return acc;
    }, {});

    const list = Object.values(grouped);

    // Filter by vendor name
    const filteredList = list.filter((vendor) =>
      vendor.vendorName.toLowerCase().includes(search.trim().toLowerCase())
    );

    // Sort
    switch (sortBy) {
      case "revenue-high":
        return filteredList.sort((a, b) => b.revenue - a.revenue);
      case "revenue-low":
        return filteredList.sort((a, b) => a.revenue - b.revenue);
      case "orders-high":
        return filteredList.sort((a, b) => b.orderCount - a.orderCount);
      case "orders-low":
        return filteredList.sort((a, b) => a.orderCount - b.orderCount);
      default:
        return filteredList;
    }
  }, [orders, sortBy, search]);

  if (loading) return <Loader />;

  return (
    <div>
      <h1 className="text-xl font-bold text-[#1A1A1A] mb-6">Reports</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="bg-white border border-[#C7D8EA] rounded-xl p-4">
          <p className="text-sm text-gray-500">Total Orders</p>
          <p className="text-2xl font-bold text-[#1A1A1A]">{orders.length}</p>
        </div>
        <div className="bg-white border border-[#C7D8EA] rounded-xl p-4">
          <p className="text-sm text-gray-500">Total Expected Revenue</p>
          <p className="text-2xl font-bold text-[#1A1A1A]">
            Rs. {totalExpectedRevenue.toLocaleString()}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            Based on orders sent via WhatsApp, not confirmed payments
          </p>
        </div>
      </div>

      {/* Controls: Dropdown (right, left of search bar) + Search (right) */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-end gap-3 mb-6">
        {/* Sort Dropdown (Right, left of search bar) */}
        <div className="relative w-full md:w-56">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full appearance-none pl-3 pr-9 py-2 rounded-lg border border-[#C7D8EA] bg-white text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#316EB2] focus:border-[#316EB2] cursor-pointer"
          >
            {SORT_OPTIONS.map((opt) => (
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

        {/* Search Bar (Right) */}
        <div className="relative w-full md:w-72">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5D8DC2]"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search vendor name..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-[#C7D8EA] bg-white text-[#1A1A1A] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#316EB2] focus:border-[#316EB2]"
          />
        </div>
      </div>

      <div className="bg-white border border-[#C7D8EA] rounded-xl overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[#C7D8EA] text-sm text-gray-500">
              <th className="py-3 px-4">Vendor</th>
              <th className="py-3 px-4">Orders</th>
              <th className="py-3 px-4">Expected Revenue</th>
            </tr>
          </thead>
          <tbody>
            {vendorStats.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-8 px-4 text-center text-sm text-gray-500">
                  No orders yet.
                </td>
              </tr>
            ) : (
              vendorStats.map(({ vendorName, orderCount, revenue }) => (
                <tr key={vendorName} className="border-b border-[#C7D8EA] last:border-b-0">
                  <td className="py-3 px-4 text-sm font-medium text-[#1A1A1A]">{vendorName}</td>
                  <td className="py-3 px-4 text-sm text-[#5D8DC2] font-medium">{orderCount}</td>
                  <td className="py-3 px-4 text-sm text-[#1A1A1A]">
                    Rs. {revenue.toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}