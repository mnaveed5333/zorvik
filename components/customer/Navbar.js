"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Menu, X, Tag, ShoppingBag } from "lucide-react";
import axios from "axios";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  const isHome = pathname === "/";

  const navLinks = [
    { href: "/shop", label: "Shop" },
    { href: "/stores", label: "All Stores" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ];

  // Debounced search fetch
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await axios.get("/api/products", {
          params: { search: query.trim(), limit: 8 },
          timeout: 8000,
        });
        setResults(res.data?.products || []);
        setShowDropdown(true);
      } catch (err) {
        console.error("Search failed:", err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  // Reset search state when leaving home page
  useEffect(() => {
    if (!isHome) {
      setQuery("");
      setResults([]);
      setShowDropdown(false);
    }
  }, [isHome]);

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      if (!query.trim()) return;
      setShowDropdown(false);
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    },
    [query, router]
  );

  const goToProduct = (product) => {
    setShowDropdown(false);
    setQuery("");
    router.push(`/product/${product._id}`);
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#C7D8EA] shadow-sm">
      <div className="relative max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-6">
        {/* Logo */}
        <Link href="/" className="text-2xl font-bold text-[#316EB2] shrink-0">
          Zorvik<span className="text-[#EC3237]">.</span>
        </Link>

        {/* Nav links - fixed position, never shifts regardless of search bar */}
        <div className="hidden md:flex items-center gap-6 ml-auto">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-lg font-medium text-base transition-colors ${
                  isActive
                    ? "bg-[#316EB2] text-white"
                    : "text-[#1A1A1A] hover:bg-[#C7D8EA]/50"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Search bar - absolutely centered, only on home, out of normal flow */}
        {isHome && (
          <div
            className="hidden md:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-64"
            ref={searchRef}
          >
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => query.trim() && setShowDropdown(true)}
                placeholder="Search products"
                className="w-full px-4 py-2 pl-10 rounded-full border border-[#C7D8EA] bg-white text-[#1A1A1A] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#316EB2] focus:border-[#316EB2] transition-all text-sm"
              />
              <Search size={16} className="absolute left-3 top-2.5 text-[#5D8DC2]" />
            </form>

            {/* Dropdown results */}
            {showDropdown && (
              <div className="absolute top-full mt-2 w-full bg-white border border-[#C7D8EA] rounded-xl shadow-lg max-h-96 overflow-y-auto">
                {loading && (
                  <div className="px-4 py-3 text-sm text-gray-500">Searching...</div>
                )}

                {!loading && results.length === 0 && (
                  <div className="px-4 py-3 text-sm text-gray-500">
                    No results found for "{query}"
                  </div>
                )}

                {!loading &&
                  results.map((product) => (
                    <button
                      key={product._id}
                      onClick={() => goToProduct(product)}
                      className="w-full flex flex-col gap-0.5 px-4 py-2.5 hover:bg-[#C7D8EA]/40 text-left transition-colors border-b border-[#C7D8EA] last:border-b-0"
                    >
                      <p className="text-sm font-medium text-[#1A1A1A] truncate">
                        {product.name}
                      </p>
                      <div className="flex items-center gap-3">
                        {product.category?.name && (
                          <span className="flex items-center gap-1 text-xs text-[#5D8DC2]">
                            <Tag size={11} />
                            {product.category.name}
                          </span>
                        )}
                        {product.vendor?.shopName && (
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <ShoppingBag size={11} />
                            {product.vendor.shopName}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}

                {!loading && results.length > 0 && (
                  <button
                    onClick={handleSubmit}
                    className="w-full px-4 py-2.5 text-sm font-medium text-[#316EB2] hover:bg-[#C7D8EA]/40 text-center transition-colors"
                  >
                    See all results for "{query}"
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Mobile menu toggle - stays on right */}
        <button
          className="md:hidden text-[#316EB2] ml-auto"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu overlay backdrop */}
      {menuOpen && (
        <div
          className="md:hidden fixed inset-0 top-[57px] bg-black/30 z-30"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Mobile menu - absolutely positioned so it overlays, doesn't push content */}
      {menuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 z-40 flex flex-col gap-3 px-4 pb-4 pt-3 bg-white border-b border-[#C7D8EA] shadow-lg max-h-[calc(100vh-57px)] overflow-y-auto">
          {isHome && (
            <>
              <form onSubmit={handleSubmit} className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search products"
                  className="w-full px-4 py-2 pl-10 rounded-full border border-[#C7D8EA] bg-white text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#316EB2]"
                />
                <Search size={18} className="absolute left-3 top-2.5 text-[#5D8DC2]" />
              </form>

              {showDropdown && results.length > 0 && (
                <div className="bg-white border border-[#C7D8EA] rounded-xl max-h-80 overflow-y-auto">
                  {results.map((product) => (
                    <button
                      key={product._id}
                      onClick={() => {
                        goToProduct(product);
                        setMenuOpen(false);
                      }}
                      className="w-full flex flex-col gap-0.5 px-4 py-2.5 hover:bg-[#C7D8EA]/40 text-left border-b border-[#C7D8EA] last:border-b-0"
                    >
                      <p className="text-sm font-medium text-[#1A1A1A] truncate">{product.name}</p>
                      <div className="flex items-center gap-3">
                        {product.category?.name && (
                          <span className="flex items-center gap-1 text-xs text-[#5D8DC2]">
                            <Tag size={11} />
                            {product.category.name}
                          </span>
                        )}
                        {product.vendor?.shopName && (
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <ShoppingBag size={11} />
                            {product.vendor.shopName}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`py-2 px-3 rounded-lg font-medium ${
                  isActive ? "bg-[#316EB2] text-white" : "text-[#1A1A1A]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}