"use client";

import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Plus, Search, Tag } from "lucide-react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Loader from "@/components/ui/Loader";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");

  const fetchCategories = async () => {
    try {
      const { data } = await axios.get("/api/categories");
      if (data.success) setCategories(data.categories);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const filteredCategories = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter(
      (c) => c.name?.toLowerCase().includes(q) || c.slug?.toLowerCase().includes(q)
    );
  }, [categories, search]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newCategory.trim()) return;
    setSubmitting(true);
    try {
      await axios.post("/api/categories", { name: newCategory });
      toast.success("Category added");
      setNewCategory("");
      fetchCategories();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add category");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#1A1A1A]">Categories</h1>
          <p className="text-sm font-medium text-[#5D8DC2] mt-0.5">
            {categories.length} categor{categories.length === 1 ? "y" : "ies"} total
          </p>
        </div>
      </div>

      {/* Controls row: Add form (left) + Search (right) */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <form onSubmit={handleAdd} className="flex items-stretch gap-2 w-full md:w-auto md:max-w-sm">
          <Input
            name="newCategory"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="New category name"
            className="mb-0 h-10"
          />
          <Button
            type="submit"
            disabled={submitting}
            className="h-10 flex items-center justify-center gap-1 whitespace-nowrap bg-[#EC3237] hover:opacity-90 text-white"
          >
            <Plus size={16} /> Add
          </Button>
        </form>

        <div className="relative w-full md:w-[280px]">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5D8DC2]"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search categories..."
            className="w-full h-10 pl-9 pr-3 text-sm font-medium rounded-lg border border-[#C7D8EA] bg-white text-[#1A1A1A] placeholder-[#5D8DC2] focus:outline-none focus:ring-2 focus:ring-[#316EB2] focus:border-[#316EB2]"
          />
        </div>
      </div>

      {/* Grid of category cards instead of a table */}
      {filteredCategories.length === 0 ? (
        <div className="bg-white border border-[#C7D8EA] rounded-xl py-12 text-center text-sm font-medium text-[#1A1A1A]">
          No categories match your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredCategories.map((cat) => (
            <div
              key={cat._id}
              className="bg-white border border-[#C7D8EA] rounded-xl p-4 flex items-center gap-3 hover:border-[#316EB2] transition-colors"
            >
              <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#C7D8EA]/60 text-[#316EB2] shrink-0">
                <Tag size={18} />
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-[#1A1A1A] truncate">{cat.name}</p>
                  {cat.isDefault && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#316EB2]/10 text-[#316EB2] shrink-0">
                      Default
                    </span>
                  )}
                </div>
                <p className="text-xs font-mono font-medium text-[#5D8DC2] truncate">{cat.slug}</p>
              </div>

              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#C7D8EA] text-[#316EB2] shrink-0">
                {cat.productCount}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}