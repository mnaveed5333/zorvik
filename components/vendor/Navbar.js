"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import axios from "axios";
import toast from "react-hot-toast";
import { Menu, X, LogOut, PlusCircle } from "lucide-react";
import { logout } from "@/redux/slices/authSlice";

const links = [
  { href: "/vendor/dashboard", label: "Dashboard" },
  { href: "/vendor/products", label: "Products" },
  { href: "/vendor/orders", label: "Orders" },
  { href: "/vendor/settings", label: "Settings" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const handleLogout = async () => {
    try {
      await axios.delete("/api/auth/vendor");
      dispatch(logout());
      toast.success("Logged out");
      router.push("/vendor/login");
    } catch (error) {
      toast.error("Failed to logout");
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#C7D8EA] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <Link href="/vendor/dashboard" className="text-xl font-bold text-[#316EB2] shrink-0">
          Zorvik<span className="text-[#EC3237]">.</span> Vendor
        </Link>

        <nav className="hidden md:flex items-center gap-2">
          {links.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active ? "bg-[#316EB2] text-white" : "text-[#1A1A1A] hover:bg-[#C7D8EA]/50"
                }`}
              >
                {label}
              </Link>
            );
          })}
          <Link
            href="/vendor/products/add"
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white bg-[#EC3237] hover:opacity-90"
          >
            <PlusCircle size={16} />
            Add Product
          </Link>
        </nav>

        <button
          onClick={handleLogout}
          className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-[#EC3237] hover:bg-[#C7D8EA]/30 transition-colors shrink-0"
        >
          <LogOut size={16} />
          Logout
        </button>

        <button className="md:hidden text-[#316EB2]" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {menuOpen && (
        <div
          className="md:hidden fixed inset-0 top-[57px] bg-black/30 z-30"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {menuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 z-40 flex flex-col gap-1 px-4 pb-4 pt-3 bg-white border-b border-[#C7D8EA] shadow-lg max-h-[calc(100vh-57px)] overflow-y-auto">
          {links.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className={`py-2.5 px-3 rounded-lg text-sm font-medium ${
                  active ? "bg-[#316EB2] text-white" : "text-[#1A1A1A]"
                }`}
              >
                {label}
              </Link>
            );
          })}
          <Link
            href="/vendor/products/add"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium text-white bg-[#EC3237]"
          >
            <PlusCircle size={16} /> Add Product
          </Link>
          <button
            onClick={() => {
              setMenuOpen(false);
              handleLogout();
            }}
            className="text-left py-2.5 px-3 rounded-lg text-sm font-medium text-[#EC3237]"
          >
            Logout
          </button>
        </div>
      )}
    </header>
  );
}