"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { MessageCircle, Clock, CheckCircle2 } from "lucide-react";
import Button from "@/components/ui/Button";
import { buildQueryContactLink } from "@/utils/whatsappHelper";

export default function AdminContactPage() {
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchQueries();
  }, []);

  const fetchQueries = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("/api/queries");
      if (data.success) setQueries(data.queries);
    } catch (error) {
      toast.error("Failed to load queries");
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (query) => {
    const newStatus = query.status === "new" ? "resolved" : "new";
    try {
      const { data } = await axios.patch("/api/queries", {
        queryId: query._id,
        status: newStatus,
      });
      if (data.success) {
        setQueries((prev) =>
          prev.map((q) => (q._id === query._id ? { ...q, status: newStatus } : q))
        );
      }
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const filteredQueries =
    filter === "all" ? queries : queries.filter((q) => q.status === filter);

  const formatNumber = (num) => `+${num.slice(0, 2)} ${num.slice(2)}`;

  return (
    <div className="bg-white min-h-screen p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Customer Queries</h1>

        <div className="flex gap-2">
          {["all", "new", "resolved"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                filter === f
                  ? "bg-[#316EB2] text-white"
                  : "bg-[#C7D8EA]/40 text-[#1A1A1A] hover:bg-[#C7D8EA]/70"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500 text-center py-12">Loading queries...</p>
      ) : filteredQueries.length === 0 ? (
        <p className="text-gray-500 text-center py-12">No queries found.</p>
      ) : (
        <div className="grid gap-4">
          {filteredQueries.map((query) => (
            <div
              key={query._id}
              className="border border-[#C7D8EA] rounded-xl p-5 bg-white shadow-sm"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <p className="font-semibold text-[#1A1A1A]">{query.name}</p>
                  <p className="text-sm text-gray-500">{formatNumber(query.whatsappNumber)}</p>
                </div>

                <span
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium shrink-0 ${
                    query.status === "new"
                      ? "bg-[#EC3237]/10 text-[#EC3237]"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {query.status === "new" ? <Clock size={12} /> : <CheckCircle2 size={12} />}
                  {query.status === "new" ? "New" : "Resolved"}
                </span>
              </div>

              <p className="text-sm text-[#1A1A1A] bg-[#C7D8EA]/20 rounded-lg p-3 mb-3">
                {query.message}
              </p>

              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400">
                  {new Date(query.createdAt).toLocaleString()}
                </p>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="!px-3 !py-1.5 text-xs"
                    onClick={() => toggleStatus(query)}
                  >
                    Mark {query.status === "new" ? "Resolved" : "New"}
                  </Button>
                  <a
                    href={buildQueryContactLink(query)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="whatsapp" className="!px-3 !py-1.5 text-xs">
                      <span className="flex items-center gap-1.5">
                        <MessageCircle size={14} />
                        WhatsApp
                      </span>
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}