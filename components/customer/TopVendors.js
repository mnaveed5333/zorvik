"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import ShopAvatar from "@/components/shared/ShopAvatar";

const VISIBLE_COUNT = 7;
const ROTATE_INTERVAL = 60000; // 1 minute

function getRandomSubset(arr, count) {
  if (arr.length <= count) return arr;
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export default function VendorsSection() {
  const [allVendors, setAllVendors] = useState([]);
  const [visible, setVisible] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const { data } = await axios.get("/api/vendors");
        if (data.success) {
          const active = data.vendors.filter((v) => v.status === "active");
          setAllVendors(active);
          setVisible(getRandomSubset(active, VISIBLE_COUNT));
        }
      } catch (error) {
        console.error("Failed to load vendors", error);
      } finally {
        setLoading(false);
      }
    };
    fetchVendors();
  }, []);

  useEffect(() => {
    if (allVendors.length === 0) return;
    const timer = setInterval(() => {
      setVisible(getRandomSubset(allVendors, VISIBLE_COUNT));
    }, ROTATE_INTERVAL);
    return () => clearInterval(timer);
  }, [allVendors]);

  if (loading || visible.length === 0) return null;

  return (
    <section className="w-full py-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Vendors</h2>
        <Link
          href="/stores"
          className="text-sm font-medium text-[#316EB2] hover:text-[#EC3237] transition-colors"
        >
          View all stores
        </Link>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {visible.map((vendor) => (
          <Link
            key={vendor._id}
            href={`/vendor/${vendor._id}`}
            className="flex min-w-[150px] flex-col items-center gap-2 rounded-xl border border-[#C7D8EA] bg-white p-4 text-center transition-all hover:border-[#316EB2] hover:shadow-sm"
          >
            <ShopAvatar shopName={vendor.shopName} logoUrl={vendor.shopLogo?.url} size={48} />
            <span className="text-sm font-medium text-gray-800 line-clamp-1">
              {vendor.shopName}
            </span>
            <span className="text-xs text-gray-500">{vendor.shopId}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}