"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import ProductCard from "@/components/customer/ProductCard";
import Loader from "@/components/ui/Loader";

export default function CategoryPage() {
  const { categorySlug } = useParams();
  const [products, setProducts] = useState([]);
  const [categoryName, setCategoryName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: catData } = await axios.get("/api/categories");
        const category = catData.categories?.find((c) => c.slug === categorySlug);
        setCategoryName(category?.name || categorySlug);

        if (category) {
          const { data } = await axios.get(`/api/products?category=${category._id}`);
          if (data.success) setProducts(data.products);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [categorySlug]);

  if (loading) return <Loader />;

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-8">

        <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#C7D8EA]">
          <h1 className="text-xl font-bold text-[#1A1A1A] capitalize">
            {categoryName}
          </h1>
          <span className="text-xs font-medium text-[#5D8DC2] bg-[#C7D8EA]/30 px-3 py-1 rounded-full">
            {products.length} {products.length === 1 ? "item" : "items"}
          </span>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[#316EB2] font-semibold mb-1">No products yet</p>
            <p className="text-[#5D8DC2] text-sm">
              This category doesn't have any listings right now — check back soon.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}