"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import ProductCard from "@/components/customer/ProductCard";
import Loader from "@/components/ui/Loader";

const VISIBLE_COUNT = 8;
const ROTATE_INTERVAL = 60000; // 1 minute

function getRandomSubset(arr, count) {
  if (arr.length <= count) return arr;
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export default function TrendingProducts() {
  const [allProducts, setAllProducts] = useState([]);
  const [visible, setVisible] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await axios.get("/api/products");
        if (data.success) {
          setAllProducts(data.products);
          setVisible(getRandomSubset(data.products, VISIBLE_COUNT));
        }
      } catch (error) {
        console.error("Failed to load products", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    if (allProducts.length === 0) return;
    const timer = setInterval(() => {
      setVisible(getRandomSubset(allProducts, VISIBLE_COUNT));
    }, ROTATE_INTERVAL);
    return () => clearInterval(timer);
  }, [allProducts]);

  if (loading) {
    return (
      <section className="w-full py-8">
        <Loader />
      </section>
    );
  }

  if (visible.length === 0) return null;

  return (
    <section className="w-full py-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Products</h2>
        <Link
          href="/shop?sort=trending"
          className="text-sm font-medium text-[#316EB2] hover:text-[#EC3237] transition-colors"
        >
          View all
        </Link>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {visible.map((product) => (
          <div key={product._id} className="w-[45vw] sm:w-[220px] shrink-0">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}