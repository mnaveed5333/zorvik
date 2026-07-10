"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { IconCategory } from "@tabler/icons-react";

const VISIBLE_COUNT = 8;
const ROTATE_INTERVAL = 60000; // 1 minute

function getRandomSubset(arr, count) {
  if (arr.length <= count) return arr;
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export default function CategoryGrid() {
  const [allCategories, setAllCategories] = useState([]);
  const [visible, setVisible] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch categories added by admin
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await axios.get("/api/categories");
        if (data.success) {
          setAllCategories(data.categories);
          setVisible(getRandomSubset(data.categories, VISIBLE_COUNT));
        }
      } catch (error) {
        console.error("Failed to load categories", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  // Every 1 minute, pick a new random set and swap instantly
  useEffect(() => {
    if (allCategories.length === 0) return;
    const timer = setInterval(() => {
      setVisible(getRandomSubset(allCategories, VISIBLE_COUNT));
    }, ROTATE_INTERVAL);
    return () => clearInterval(timer);
  }, [allCategories]);

  if (loading || visible.length === 0) return null;

  return (
    <section className="w-full py-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Shop by Category</h2>
        <Link
          href="/shop"
          className="text-sm font-medium text-[#316EB2] hover:text-[#EC3237] transition-colors"
        >
          View all
        </Link>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {visible.map((cat) => (
          <Link
            key={cat._id}
            href={`/shop?category=${encodeURIComponent(cat.name)}`}
            className="group flex flex-col items-center justify-center gap-2 rounded-xl border border-[#C7D8EA] bg-white p-4 text-center transition-all hover:border-[#EC3237] hover:shadow-sm shrink-0 w-[22vw] sm:w-[130px]"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#C7D8EA] transition-colors group-hover:bg-[#EC3237]/10 overflow-hidden shrink-0">
              {cat.image ? (
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <IconCategory
                  size={22}
                  stroke={1.75}
                  className="text-[#316EB2] transition-colors group-hover:text-[#EC3237]"
                />
              )}
            </div>
            <span className="text-xs font-medium text-gray-700 group-hover:text-[#EC3237] transition-colors truncate w-full">
              {cat.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}