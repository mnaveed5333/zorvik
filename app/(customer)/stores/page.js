"use client";

import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { Search } from "lucide-react";
import Loader from "@/components/ui/Loader";
import VendorRow from "@/components/customer/VendorRow";

const RESHUFFLE_INTERVAL = 60000; // 1 minute

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

export default function AllShopsPage() {
  const [vendors, setVendors] = useState([]);
  const [order, setOrder] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const { data } = await axios.get("/api/vendors");
        if (data.success) {
          setVendors(data.vendors);
          setOrder(shuffle(data.vendors));
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchVendors();
  }, []);

  // Reshuffle display order every 1 minute
  useEffect(() => {
    if (vendors.length === 0) return;
    const timer = setInterval(() => {
      setOrder(shuffle(vendors));
    }, RESHUFFLE_INTERVAL);
    return () => clearInterval(timer);
  }, [vendors]);

  const filteredVendors = order.filter((v) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return (
      v.shopName?.toLowerCase().includes(term) ||
      v.shopId?.toLowerCase().includes(term)
    );
  });

  if (loading) return <Loader />;

  return (
    <div className="max-w-3xl mx-auto bg-white px-4 py-6">
      <h1 className="text-xl font-bold mb-5" style={{ color: "#316EB2" }}>
        All Shops
      </h1>

      <div className="relative mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search shop name or shop ID..."
          className="w-full px-4 py-2 pl-10 rounded-full border outline-none transition"
          style={{
            borderColor: "#C7D8EA",
            color: "#1A1A1A",
            backgroundColor: "#FFFFFF",
          }}
          onFocus={(e) => (e.target.style.borderColor = "#316EB2")}
          onBlur={(e) => (e.target.style.borderColor = "#C7D8EA")}
        />
        <Search
          size={18}
          className="absolute left-3 top-2.5"
          style={{ color: "#5D8DC2" }}
        />
      </div>

      {filteredVendors.length === 0 ? (
        <p className="text-center py-16 text-sm" style={{ color: "#5D8DC2" }}>
          No shops found.
        </p>
      ) : (
        <div className="space-y-3">
          {filteredVendors.map((vendor) => (
            <VendorRow key={vendor._id} vendor={vendor} />
          ))}
        </div>
      )}
    </div>
  );
}