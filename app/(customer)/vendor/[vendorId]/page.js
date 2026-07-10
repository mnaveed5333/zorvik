"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import Loader from "@/components/ui/Loader";
import ProductCard from "@/components/customer/ProductCard";
import ShopAvatar from "@/components/shared/ShopAvatar";

// Searchable category combobox — works with category objects {_id, name}
function CategoryFilter({ categories, products, selectedCategory, setSelectedCategory }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return categories;
    return categories.filter((c) =>
      c.name.toLowerCase().includes(query.trim().toLowerCase())
    );
  }, [categories, query]);

  const selectedName =
    selectedCategory === "all"
      ? `All Categories (${products.length})`
      : categories.find((c) => c._id === selectedCategory)?.name || "All Categories";

  const handleSelect = (id) => {
    setSelectedCategory(id);
    setOpen(false);
    setQuery("");
  };

  return (
    <div className="relative w-full sm:w-64" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full px-4 py-2 rounded-lg border text-sm text-left flex items-center justify-between"
        style={{
          borderColor: "#C7D8EA",
          color: "#1A1A1A",
          backgroundColor: "#FFFFFF",
        }}
      >
        <span className="truncate">{selectedName}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-4 w-4 ml-2 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="#5D8DC2"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute z-20 mt-1 w-full rounded-lg border bg-white shadow-lg"
          style={{ borderColor: "#C7D8EA" }}
        >
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search category..."
            className="w-full px-3 py-2 text-sm border-b outline-none"
            style={{ borderColor: "#C7D8EA", color: "#1A1A1A" }}
          />

          <div className="max-h-56 overflow-y-auto">
            <div
              onClick={() => handleSelect("all")}
              className="px-4 py-2 text-sm cursor-pointer hover:bg-[#C7D8EA]/30"
              style={{ color: selectedCategory === "all" ? "#EC3237" : "#1A1A1A" }}
            >
              All Categories ({products.length})
            </div>

            {filtered.map((cat) => (
              <div
                key={cat._id}
                onClick={() => handleSelect(cat._id)}
                className="px-4 py-2 text-sm cursor-pointer hover:bg-[#C7D8EA]/30"
                style={{ color: selectedCategory === cat._id ? "#EC3237" : "#1A1A1A" }}
              >
                {cat.name} ({products.filter((p) => p.category?._id === cat._id).length})
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="px-4 py-3 text-sm text-center" style={{ color: "#5D8DC2" }}>
                No matching category.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function VendorStorefrontPage() {
  const { vendorId } = useParams();

  const [vendor, setVendor] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [vendorRes, productsRes] = await Promise.all([
          axios.get(`/api/vendors?id=${vendorId}`),
          axios.get(`/api/products?vendor=${vendorId}`),
        ]);
        if (vendorRes.data.success) setVendor(vendorRes.data.vendor);
        if (productsRes.data.success) setProducts(productsRes.data.products);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    if (vendorId) fetchData();
  }, [vendorId]);

  if (loading) return <Loader />;
  if (!vendor)
    return (
      <p className="text-center py-16 text-sm" style={{ color: "#5D8DC2" }}>
        Shop not found.
      </p>
    );

  const categories = Array.from(
    new Map(
      products
        .filter((p) => p.category?._id)
        .map((p) => [p.category._id, p.category])
    ).values()
  );

  const filteredProducts =
    selectedCategory === "all"
      ? products
      : products.filter((p) => p.category?._id === selectedCategory);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 bg-white">
      {/* Shop header — logo on top, badges for name + id centered below it */}
      <div
        className="flex flex-col items-center text-center bg-white border rounded-xl p-6 mb-8"
        style={{ borderColor: "#C7D8EA" }}
      >
        <ShopAvatar shopName={vendor.shopName} logoUrl={vendor.shopLogo?.url} size={72} />

        <div className="mt-4 flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
          <div
            className="px-4 py-1.5 rounded-lg border text-sm font-semibold"
            style={{
              backgroundColor: "rgba(199, 216, 234, 0.35)",
              borderColor: "#C7D8EA",
              color: "#1A1A1A",
            }}
          >
            Shop Name: <span className="font-bold">{vendor.shopName}</span>
          </div>

          <div
            className="px-4 py-1.5 rounded-lg border text-sm font-semibold"
            style={{
              backgroundColor: "rgba(199, 216, 234, 0.35)",
              borderColor: "#C7D8EA",
              color: "#1A1A1A",
            }}
          >
            Shop ID: <span className="font-bold">{vendor.shopId}</span>
          </div>
        </div>
      </div>

      {/* Category filter — searchable combobox */}
      {categories.length > 0 && (
        <div className="mb-6">
          <label className="text-sm block mb-1.5" style={{ color: "#1A1A1A" }}>
            Filter by Category
          </label>
          <CategoryFilter
            categories={categories}
            products={products}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
          />
        </div>
      )}

      {/* Products section title */}
      <h2 className="text-lg font-semibold mb-4" style={{ color: "#1A1A1A" }}>
        Products
      </h2>

      {/* Products grid */}
      {filteredProducts.length === 0 ? (
        <p className="text-center py-16 text-sm" style={{ color: "#5D8DC2" }}>
          No products in this category yet.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {filteredProducts.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}