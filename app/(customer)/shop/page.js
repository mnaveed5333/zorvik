import { Suspense } from "react";
import ShopContent from "./ShopContent";
import Loader from "@/components/ui/Loader";

export default function ShopPage() {
  return (
    <Suspense fallback={<Loader />}>
      <ShopContent />
    </Suspense>
  );
}