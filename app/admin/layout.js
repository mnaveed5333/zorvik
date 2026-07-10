"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/admin/Sidebar";

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const isPublic = pathname === "/admin/login";

  if (isPublic) {
    return <div className="min-h-screen bg-white">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-white">
      <Sidebar />
      <main className="max-w-7xl mx-auto p-6">{children}</main>
    </div>
  );
}