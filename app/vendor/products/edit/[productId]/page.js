"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import ProductForm from "@/components/vendor/ProductForm";
import Loader from "@/components/ui/Loader";

export default function EditProductPage() {
  const { productId } = useParams();
  const router = useRouter();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data } = await axios.get(`/api/products?id=${productId}`);
        if (data.success) setProduct(data.product);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [productId]);

  if (loading) return <Loader />;
  if (!product) return <p className="text-center py-12">Product not found.</p>;

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Edit Product</h1>
      <ProductForm initialData={product} onSuccess={() => router.push("/vendor/products")} />
    </div>
  );
}