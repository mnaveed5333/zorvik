"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import Navbar from "@/components/vendor/Navbar";
import Loader from "@/components/ui/Loader";
import { setVendor } from "@/redux/slices/authSlice";

const publicPaths = ["/vendor/login", "/vendor/register", "/vendor/suspended"];

export default function VendorLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  const vendor = useSelector((state) => state.auth.vendor);
  const vendorId = vendor?.id || vendor?._id;
  const isPublic = publicPaths.includes(pathname);

  const [checking, setChecking] = useState(!isPublic);

  useEffect(() => {
    if (isPublic) return;
    if (vendorId) {
      setChecking(false);
      return;
    }

    let cancelled = false;
    axios
      .get("/api/vendors/me")
      .then(({ data }) => {
        if (cancelled) return;
        if (data.success && data.vendor) {
          dispatch(setVendor(data.vendor));
        } else {
          router.replace("/vendor/login");
        }
      })
      .catch(() => {
        if (!cancelled) router.replace("/vendor/login");
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isPublic, vendorId, dispatch, router]);

  if (isPublic) {
    return <div className="min-h-screen bg-white">{children}</div>;
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="max-w-7xl mx-auto p-6">{children}</main>
    </div>
  );
}