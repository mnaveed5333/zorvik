import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export default function VendorSuspendedPage() {
  return (
    <div className="max-w-md mx-auto py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
        <AlertTriangle size={28} className="text-red-500" />
      </div>
      <h1 className="text-xl font-bold text-gray-900  mb-2">
        Your account has been suspended
      </h1>
      <p className="text-gray-500 dark:text-gray-400 mb-6">
        Please contact Zorvik support to resolve this and restore access to your dashboard.
      </p>
      <Link href="/contact" className="text-purple-600 dark:text-pink-400 font-medium">
        Contact Support
      </Link>
    </div>
  );
}