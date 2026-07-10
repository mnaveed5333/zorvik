import { Suspense } from "react";
import CheckoutContent from "./CheckoutContent";
import Loader from "@/components/ui/Loader";

export default function CheckoutPage() {
  return (
    <Suspense fallback={<Loader />}>
      <CheckoutContent />
    </Suspense>
  );
}