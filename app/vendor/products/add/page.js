"use client";

import { useRouter } from "next/navigation";
import ProductForm from "@/components/vendor/ProductForm";

export default function AddProductPage() {
  const router = useRouter();

  return (
    <div className="w-full">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-6 text-center">
        Add New Product
      </h1>
      <ProductForm onSuccess={() => router.push("/vendor/products")} />
    </div>
  );
}