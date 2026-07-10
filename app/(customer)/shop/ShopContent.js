"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import axios from "axios";
import ProductCard from "@/components/customer/ProductCard";
import Loader from "@/components/ui/Loader";

// Searchable category combobox — scales to 100+ categories
function CategoryFilter({ categories, category, setCategory }) {
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
      c.toLowerCase().includes(query.trim().toLowerCase())
    );
  }, [categories, query]);

  const handleSelect = (cat) => {
    setCategory(cat);
    setOpen(false);
    setQuery("");
  };

  return (
    <div className="relative w-full sm:w-1/4" ref={wrapperRef}>
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
        <span className="truncate">
          {category === "all" ? "All Categories" : category}
        </span>
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
              style={{ color: category === "all" ? "#EC3237" : "#1A1A1A" }}
            >
              All Categories
            </div>

            {filtered.map((cat) => (
              <div
                key={cat}
                onClick={() => handleSelect(cat)}
                className="px-4 py-2 text-sm cursor-pointer hover:bg-[#C7D8EA]/30"
                style={{ color: category === cat ? "#EC3237" : "#1A1A1A" }}
              >
                {cat}
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

// Sort dropdown — same style/behavior as CategoryFilter, no search needed (few options)
function SortFilter({ sortOrder, setSortOrder }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  const options = [
    { value: "default", label: "Sort: Default" },
    { value: "lowToHigh", label: "Price: Low to High" },
    { value: "highToLow", label: "Price: High to Low" },
  ];

  const current = options.find((o) => o.value === sortOrder)?.label || "Sort: Default";

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (value) => {
    setSortOrder(value);
    setOpen(false);
  };

  return (
    <div className="relative w-full sm:w-1/4" ref={wrapperRef}>
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
        <span className="truncate">{current}</span>
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
          <div className="max-h-56 overflow-y-auto">
            {options.map((opt) => (
              <div
                key={opt.value}
                onClick={() => handleSelect(opt.value)}
                className="px-4 py-2 text-sm cursor-pointer hover:bg-[#C7D8EA]/30"
                style={{ color: sortOrder === opt.value ? "#EC3237" : "#1A1A1A" }}
              >
                {opt.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ShopContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(searchParams.get("category") || "all");
  const [sortOrder, setSortOrder] = useState("default");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await axios.get("/api/products");
        if (data.success) setProducts(data.products);
      } catch (error) {
        console.error("Failed to load products", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    const urlCategory = searchParams.get("category") || "all";
    setCategory(urlCategory);
  }, [searchParams]);

  const handleSetCategory = (cat) => {
    setCategory(cat);
    const params = new URLSearchParams(searchParams.toString());
    if (cat === "all") {
      params.delete("category");
    } else {
      params.set("category", cat);
    }
    router.replace(`/shop?${params.toString()}`, { scroll: false });
  };

  const getCategoryName = (cat) => {
    if (!cat) return null;
    return typeof cat === "object" ? cat.name : cat;
  };

  const categories = useMemo(() => {
    const unique = new Set(
      products.map((p) => getCategoryName(p.category)).filter(Boolean)
    );
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (search.trim()) {
      result = result.filter((p) =>
        p.name?.toLowerCase().includes(search.trim().toLowerCase())
      );
    }

    if (category !== "all") {
      result = result.filter((p) => getCategoryName(p.category) === category);
    }

    if (sortOrder === "lowToHigh") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortOrder === "highToLow") {
      result.sort((a, b) => b.price - a.price);
    }

    return result;
  }, [products, search, category, sortOrder]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 bg-white">
      <h2 className="text-xl sm:text-2xl font-bold mb-5" style={{ color: "#316EB2" }}>
        All Products
      </h2>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <div className="relative w-full sm:w-1/3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
            fill="none"
            viewBox="0 0 24 24"
            stroke="#5D8DC2"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z"
            />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border outline-none text-sm transition"
            style={{
              borderColor: "#C7D8EA",
              color: "#1A1A1A",
              backgroundColor: "#FFFFFF",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#316EB2")}
            onBlur={(e) => (e.target.style.borderColor = "#C7D8EA")}
          />
        </div>

        <CategoryFilter
          categories={categories}
          category={category}
          setCategory={handleSetCategory}
        />

        <SortFilter sortOrder={sortOrder} setSortOrder={setSortOrder} />
      </div>

      {loading ? (
        <Loader />
      ) : filteredProducts.length === 0 ? (
        <p className="text-center py-10 text-sm" style={{ color: "#5D8DC2" }}>
          No products found.
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