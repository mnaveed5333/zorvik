"use client";

import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { Search, Calendar, X } from "lucide-react";
import OrderRow from "@/components/admin/OrderRow";
import Loader from "@/components/ui/Loader";

const toDateKey = (d) => {
  const dt = new Date(d);
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");

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

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();

    return orders.filter((o) => {
      if (dateFilter && toDateKey(o.createdAt) !== dateFilter) return false;

      if (!q) return true;
      return (
        String(o.orderId).toLowerCase().includes(q) ||
        o.vendor?.shopName?.toLowerCase().includes(q) ||
        o.vendor?.shopId?.toLowerCase().includes(q) ||
        String(o.totalAmount).toLowerCase().includes(q)
      );
    });
  }, [orders, search, dateFilter]);

  if (loading) return <Loader />;

  return (
    <div>
      <h1 className="text-xl font-bold text-[#1A1A1A] mb-6">All Orders</h1>

      <div className="flex flex-col md:flex-row md:items-center md:justify-end gap-3 mb-6">
        {/* Date filter */}
        <div className="relative w-full md:w-56">
          <Calendar
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5D8DC2] pointer-events-none"
          />
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-sm font-medium rounded-lg border border-[#C7D8EA] bg-white text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#316EB2] focus:border-[#316EB2]"
          />
          {dateFilter && (
            <button
              onClick={() => setDateFilter("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[#5D8DC2] hover:text-[#EC3237]"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Search bar */}
        <div className="relative w-full md:w-[320px]">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5D8DC2]"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order ID, vendor, shop ID, total..."
            className="w-full pl-9 pr-3 py-2 text-sm font-medium rounded-lg border border-[#C7D8EA] bg-white text-[#1A1A1A] placeholder-[#5D8DC2] focus:outline-none focus:ring-2 focus:ring-[#316EB2] focus:border-[#316EB2]"
          />
        </div>
      </div>

      <div className="bg-white border border-[#C7D8EA] rounded-xl overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[#C7D8EA] text-sm font-semibold text-[#1A1A1A]">
              <th className="py-3 px-4">Order</th>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Vendor</th>
              <th className="py-3 px-4">Shop ID</th>
              <th className="py-3 px-4">Total</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-sm font-medium text-[#1A1A1A]">
                  No orders match your search.
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => <OrderRow key={order._id} order={order} />)
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}