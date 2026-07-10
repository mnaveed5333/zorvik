"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import Link from "next/link";
import axios from "axios";
import { Package, ShoppingBag, Clock, CheckCircle, Settings as SettingsIcon } from "lucide-react";
import Loader from "@/components/ui/Loader";
import ShopAvatar from "@/components/shared/ShopAvatar";
import { useSelector } from "react-redux";

const REFRESH_INTERVAL = 15000;

export default function VendorDashboardPage() {
  const vendor = useSelector((state) => state.auth.vendor);
  const vendorId = vendor?.id || vendor?._id;

  const [stats, setStats] = useState({ orders: 0, pending: 0, confirmed: 0 });
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const hasLoadedOnce = useRef(false);

  const fetchAll = useCallback(async () => {
    if (!vendorId) return;
    try {
      const [productsRes, ordersRes, categoriesRes] = await Promise.all([
        axios.get(`/api/products?vendor=${vendorId}`),
        axios.get(`/api/orders?vendor=${vendorId}`),
        axios.get("/api/categories"),
      ]);
      const orders = ordersRes.data.orders || [];
      setProducts(productsRes.data.products || []);
      setCategories(categoriesRes.data.categories || []);
      setStats({
        orders: orders.length,
        pending: orders.filter((o) => o.status === "placed").length,
        confirmed: orders.filter((o) => o.status === "confirmed").length,
      });
    } catch (error) {
      console.error(error);
    } finally {
      hasLoadedOnce.current = true;
      setLoading(false);
    }
  }, [vendorId]);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchAll]);

  // Count this vendor's own products per category
  const categoryCounts = useMemo(() => {
    const map = {};
    products.forEach((p) => {
      const catId = p.category?._id || p.category;
      if (!catId) return;
      map[catId] = (map[catId] || 0) + 1;
    });
    return map;
  }, [products]);

  if (loading && !hasLoadedOnce.current) return <Loader />;

  const cards = [
    { label: "Total Products", value: products.length, icon: Package, color: "#316EB2" },
    { label: "Total Orders", value: stats.orders, icon: ShoppingBag, color: "#5D8DC2" },
    { label: "Pending Orders", value: stats.pending, icon: Clock, color: "#EC3237" },
    { label: "Confirmed Orders", value: stats.confirmed, icon: CheckCircle, color: "#316EB2" },
  ];

  return (
    <div>
      {/* Big shop identity card */}
      <div className="bg-white border border-[#C7D8EA] rounded-2xl p-6 mb-6 flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <ShopAvatar shopName={vendor?.shopName} logoUrl={vendor?.shopLogo?.url} size={96} />
        <div className="flex-1 text-center sm:text-left">
          <p className="text-3xl font-extrabold text-[#1A1A1A] mb-1">{vendor?.shopName}</p>
          <p className="text-base text-[#5D8DC2] font-medium mb-1">{vendor?.vendorName}</p>
          <p className="text-sm font-mono text-[#316EB2] bg-[#C7D8EA]/50 inline-block px-3 py-1 rounded-full">
            Shop ID: {vendor?.shopId}
          </p>
          <div className="mt-3">
            <Link
              href="/vendor/settings"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#316EB2] hover:underline"
            >
              <SettingsIcon size={14} />
              Want to make changes? Go to Settings
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white border border-[#C7D8EA] rounded-xl p-4">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
              style={{ backgroundColor: color }}
            >
              <Icon size={20} className="text-white" />
            </div>
            <p className="text-2xl font-bold text-[#1A1A1A]">{value}</p>
            <p className="text-sm text-[#5D8DC2]">{label}</p>
          </div>
        ))}
      </div>

      {/* Categories */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-[#1A1A1A]">
          Categories <span className="text-[#5D8DC2] font-normal text-sm">({categories.length} total)</span>
        </h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        {categories.map((cat) => (
          <div key={cat._id} className="bg-white border border-[#C7D8EA] rounded-xl p-4">
            <p className="text-sm font-semibold text-[#1A1A1A] mb-1 truncate">{cat.name}</p>
            <p className="text-2xl font-bold text-[#316EB2]">{categoryCounts[cat._id] || 0}</p>
            <p className="text-xs text-[#5D8DC2]">your products here</p>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <Link href="/vendor/products/add" className="text-sm px-4 py-2 rounded-lg bg-[#EC3237] text-white hover:opacity-90">
          Add New Product
        </Link>
        <Link href="/vendor/orders" className="text-sm px-4 py-2 rounded-lg bg-[#C7D8EA]/50 text-[#1A1A1A]">
          View Orders
        </Link>
      </div>
    </div>
  );
}