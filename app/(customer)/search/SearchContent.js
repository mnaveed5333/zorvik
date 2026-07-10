"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import axios from "axios";
import ProductCard from "@/components/customer/ProductCard";
import Loader from "@/components/ui/Loader";

export default function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query) {
      setProducts([]);
      return;
    }
    runSearch(query);
  }, [query]);

  const runSearch = async (term) => {
    setLoading(true);
    try {
      const { data } = await axios.get(`/api/products?search=${encodeURIComponent(term)}`);
      if (data.success) setProducts(data.products);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white px-4 py-8 max-w-7xl mx-auto">
      {query && (
        <h1 className="text-xl font-semibold text-[#1A1A1A] mb-6">
          Search results for <span className="text-[#316EB2]">"{query}"</span>
        </h1>
      )}

      {loading ? (
        <Loader />
      ) : products.length === 0 ? (
        <p className="text-gray-500 text-center py-16">
          {query ? "No products matched your search." : "Search for products using the navbar above."}
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}