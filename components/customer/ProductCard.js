"use client";

import Link from "next/link";

export default function ProductCard({ product }) {
  return (
    <div className="group bg-gray-100 overflow-hidden border border-[#C7D8EA] rounded-xl hover:shadow-lg transition-shadow duration-300">
      <div className="aspect-square overflow-hidden bg-white border border-[#C7D8EA] rounded-lg m-2">
        <img
          src={product.images?.[0]?.url || "/placeholder.png"}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      <div className="p-3 bg-gray-100">
        <h3 className="text-sm font-medium text-[#1A1A1A] line-clamp-2 mb-1">
          {product.name}
        </h3>
        <p className="text-base font-bold text-[#EC3237] mb-3">
          Rs. {product.price?.toLocaleString()}
        </p>

        <Link
          href={`/product/${product._id}`}
          className="block w-full text-center py-2 bg-[#316EB2] hover:bg-[#285a91] text-white text-sm font-semibold rounded-md transition-colors"
        >
          View Details
        </Link>
      </div>
    </div>
  );
}