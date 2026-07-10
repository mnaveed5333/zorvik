"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Store, ShoppingBag, FolderTree, MessageCircle, TrendingUp, Award } from "lucide-react";
import Loader from "@/components/ui/Loader";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    vendors: 0,
    activeVendors: 0,
    orders: 0,
    categories: 0,
    totalQueries: 0,
    newQueries: 0,
    totalExpectedRevenue: 0,
  });
  const [topVendorByRevenue, setTopVendorByRevenue] = useState(null);
  const [topVendorByOrders, setTopVendorByOrders] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [vendorsRes, ordersRes, categoriesRes, allQueriesRes, newQueriesRes] =
          await Promise.all([
            axios.get("/api/vendors"),
            axios.get("/api/orders"),
            axios.get("/api/categories"),
            axios.get("/api/queries"),
            axios.get("/api/queries?status=new"),
          ]);

        const vendors = vendorsRes.data.vendors || [];
        const orders = ordersRes.data.orders || [];

        const totalExpectedRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);

        const vendorGrouped = orders.reduce((acc, o) => {
          const key = o.vendor?.shopName || "Unknown";
          if (!acc[key]) acc[key] = { vendorName: key, revenue: 0, orderCount: 0 };
          acc[key].revenue += o.totalAmount;
          acc[key].orderCount += 1;
          return acc;
        }, {});
        const vendorList = Object.values(vendorGrouped);

        const bestByRevenue = vendorList.length
          ? [...vendorList].sort((a, b) => b.revenue - a.revenue)[0]
          : null;
        const bestByOrders = vendorList.length
          ? [...vendorList].sort((a, b) => b.orderCount - a.orderCount)[0]
          : null;

        setStats({
          vendors: vendors.length,
          activeVendors: vendors.filter((v) => v.status === "active").length,
          orders: orders.length,
          categories: categoriesRes.data.categories?.length || 0,
          totalQueries: allQueriesRes.data.queries?.length || 0,
          newQueries: newQueriesRes.data.queries?.length || 0,
          totalExpectedRevenue,
        });
        setTopVendorByRevenue(bestByRevenue);
        setTopVendorByOrders(bestByOrders);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <Loader />;

  const cards = [
    { label: "Total Vendors", value: stats.vendors, icon: Store },
    { label: "Active Vendors", value: stats.activeVendors, icon: Store },
    { label: "Total Orders", value: stats.orders, icon: ShoppingBag },
    { label: "Categories", value: stats.categories, icon: FolderTree },
    { label: "Total Queries", value: stats.totalQueries, icon: MessageCircle },
    { label: "New Queries", value: stats.newQueries, icon: MessageCircle },
    {
      label: "Total Expected Revenue",
      value: `Rs. ${stats.totalExpectedRevenue.toLocaleString()}`,
      icon: TrendingUp,
    },
  ];

  return (
    <div>
      <h1 className="text-xl font-bold text-[#1A1A1A] mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {cards.map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-white border border-[#C7D8EA] rounded-xl p-4">
            <div className="w-10 h-10 rounded-lg bg-[#EC3237]/10 flex items-center justify-center mb-3">
              <Icon size={20} className="text-[#EC3237]" />
            </div>
            <p className="text-2xl font-bold text-[#1A1A1A]">{value}</p>
            <p className="text-sm text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Top vendor spotlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-[#C7D8EA] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-9 h-9 rounded-lg bg-[#EC3237]/10 flex items-center justify-center">
              <Award size={18} className="text-[#EC3237]" />
            </div>
            <p className="text-sm font-medium text-[#1A1A1A]">Top Vendor by Revenue</p>
          </div>
          {topVendorByRevenue ? (
            <>
              <p className="text-lg font-bold text-[#1A1A1A]">{topVendorByRevenue.vendorName}</p>
              <p className="text-sm text-[#316EB2] font-medium">
                Rs. {topVendorByRevenue.revenue.toLocaleString()} expected
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-500">No orders yet</p>
          )}
        </div>

        <div className="bg-white border border-[#C7D8EA] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-9 h-9 rounded-lg bg-[#EC3237]/10 flex items-center justify-center">
              <Award size={18} className="text-[#EC3237]" />
            </div>
            <p className="text-sm font-medium text-[#1A1A1A]">Top Vendor by Orders</p>
          </div>
          {topVendorByOrders ? (
            <>
              <p className="text-lg font-bold text-[#1A1A1A]">{topVendorByOrders.vendorName}</p>
              <p className="text-sm text-[#316EB2] font-medium">
                {topVendorByOrders.orderCount} order{topVendorByOrders.orderCount !== 1 ? "s" : ""}
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-500">No orders yet</p>
          )}
        </div>
      </div>
    </div>
  );
}