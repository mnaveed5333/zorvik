"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import axios from "axios";
import toast from "react-hot-toast";
import { Edit, Trash2, Plus, Search } from "lucide-react";
import Loader from "@/components/ui/Loader";
import { useSelector } from "react-redux";

export default function VendorProductsPage() {
  const vendor = useSelector((state) => state.auth.vendor);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchProducts = async () => {
    try {
      const { data } = await axios.get(`/api/products?vendor=${vendor?.id || vendor?._id}`);
      if (data.success) setProducts(data.products);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (vendor?.id || vendor?._id) fetchProducts();
  }, [vendor]);

  const handleDelete = async (productId) => {
    try {
      await axios.delete("/api/products", { data: { productId } });
      toast.success("Product deleted");
      fetchProducts();
    } catch (error) {
      toast.error("Failed to delete product");
    }
  };

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.name?.toLowerCase().includes(q));
  }, [products, search]);

  if (loading) return <Loader />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <h1 className="text-xl font-bold text-[#1A1A1A]">Your Products</h1>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5D8DC2]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products by name..."
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-[#C7D8EA] bg-white text-[#1A1A1A] placeholder-[#5D8DC2] focus:outline-none focus:ring-2 focus:ring-[#316EB2] focus:border-[#316EB2]"
            />
          </div>
          <Link
            href="/vendor/products/add"
            className="flex items-center gap-1 text-sm px-4 py-2 rounded-lg bg-[#EC3237] text-white hover:opacity-90 whitespace-nowrap"
          >
            <Plus size={16} /> Add Product
          </Link>
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <p className="text-[#5D8DC2] text-center py-12">
          {products.length === 0 ? "You haven't added any products yet." : "No products match your search."}
        </p>
      ) : (
        <div className="bg-white border border-[#C7D8EA] rounded-xl divide-y divide-[#C7D8EA] overflow-hidden">
          {filteredProducts.map((product) => (
            <div
              key={product._id}
              className="relative flex items-start gap-3 p-3 sm:p-4 hover:bg-[#C7D8EA]/10"
            >
              <img
                src={product.images?.[0]?.url || "/placeholder.png"}
                alt={product.name}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg object-cover border border-[#C7D8EA] shrink-0"
              />

              <div className="flex-1 min-w-0 pr-16 sm:pr-20">
                <h3 className="font-medium text-[#1A1A1A] text-sm sm:text-base leading-snug break-words">
                  {product.name}
                </h3>
                <p className="text-sm font-bold text-[#316EB2] mt-0.5">
                  Rs. {product.price?.toLocaleString()}
                </p>
                {product.category?.name && (
                  <p className="text-xs text-[#5D8DC2] mt-0.5">{product.category.name}</p>
                )}
              </div>

              {/* Icon-only actions, pinned bottom-right */}
              <div className="absolute bottom-3 right-3 flex gap-2">
                <Link
                  href={`/vendor/products/edit/${product._id}`}
                  aria-label="Edit product"
                  title="Edit"
                  className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#C7D8EA]/40 text-[#1A1A1A] hover:bg-[#C7D8EA]/70"
                >
                  <Edit size={15} />
                </Link>
                <button
                  onClick={() => handleDelete(product._id)}
                  aria-label="Delete product"
                  title="Delete"
                  className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#EC3237]/10 text-[#EC3237] hover:bg-[#EC3237]/20"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}