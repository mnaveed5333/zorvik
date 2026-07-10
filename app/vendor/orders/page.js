"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Search, Calendar, X } from "lucide-react";
import OrderCard from "@/components/vendor/OrderCard";
import Loader from "@/components/ui/Loader";

const toDateKey = (d) => {
  const dt = new Date(d);
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

export default function VendorOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersRes, vendorRes] = await Promise.all([
          axios.get("/api/vendor/orders"),
          axios.get("/api/vendors/me"),
        ]);
        if (ordersRes.data.success) setOrders(ordersRes.data.orders);
        if (vendorRes.data.success) setVendor(vendorRes.data.vendor);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const updateOrderStatus = async (orderId, status, previousStatus) => {
    // optimistic update
    setOrders((prev) => prev.map((o) => (o._id === orderId ? { ...o, status } : o)));

    try {
      const { data } = await axios.put("/api/vendor/orders", { orderId, status });
      if (!data.success) throw new Error("Update failed");
    } catch (error) {
      console.error(error);
      // rollback on failure
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, status: previousStatus } : o))
      );
    }
  };

  const handleConfirm = (orderId) => {
    updateOrderStatus(orderId, "confirmed", "placed");
  };

  const handleUnconfirm = (orderId) => {
    updateOrderStatus(orderId, "placed", "confirmed");
  };

  const filteredOrders = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((order) => {
      if (dateFilter && toDateKey(order.createdAt) !== dateFilter) return false;
      if (!q) return true;
      const idMatch = order._id.toLowerCase().includes(q);
      const nameMatch = order.customerName?.toLowerCase().includes(q);
      const whatsappMatch = order.customerWhatsapp?.toLowerCase().includes(q);
      return idMatch || nameMatch || whatsappMatch;
    });
  }, [orders, query, dateFilter]);

  if (loading) return <Loader />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <h1 className="text-xl font-bold text-[#1A1A1A]">Your Orders</h1>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-48">
            <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5D8DC2] pointer-events-none" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-sm rounded-lg border border-[#C7D8EA] bg-white text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#316EB2] focus:border-[#316EB2]"
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

          <div className="relative w-full sm:w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5D8DC2]" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by order ID, name, WhatsApp..."
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-[#C7D8EA] bg-white text-[#1A1A1A] placeholder-[#5D8DC2] focus:outline-none focus:ring-2 focus:ring-[#316EB2] focus:border-[#316EB2]"
            />
          </div>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <p className="text-[#5D8DC2] text-center py-12">
          {orders.length === 0 ? "No orders yet." : "No orders match your search."}
        </p>
      ) : (
        <div>
          {filteredOrders.map((order) => (
            <OrderCard
              key={order._id}
              order={order}
              vendor={vendor}
              onConfirm={handleConfirm}
              onUnconfirm={handleUnconfirm}
            />
          ))}
        </div>
      )}
    </div>
  );
}