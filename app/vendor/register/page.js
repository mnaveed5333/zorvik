"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import axios from "axios";
import toast from "react-hot-toast";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { setVendor } from "@/redux/slices/authSlice";

// CNIC: 5 digits - 7 digits - 1 digit (13 digits total, dashes auto-inserted)
function formatCNIC(value) {
  const digits = value.replace(/\D/g, "").slice(0, 13);
  if (digits.length <= 5) return digits;
  if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
}

// While typing: if user starts with 0, allow 11 digits (0 + 10). Otherwise allow 10 digits.
function formatWhatsappInput(value) {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("0")) {
    return digits.slice(0, 11);
  }
  return digits.slice(0, 10);
}

// Normalize to 92XXXXXXXXXX (no leading zero) for submission — used everywhere in the app
function normalizeWhatsapp(value) {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("0")) {
    return "92" + digits.slice(1); // drop the leading 0
  }
  return "92" + digits;
}

export default function VendorRegisterPage() {
  const [form, setForm] = useState({
    vendorName: "",
    shopName: "",
    email: "",
    password: "",
    cnic: "",
    whatsappNumber: "",
  });
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "cnic") {
      setForm((prev) => ({ ...prev, cnic: formatCNIC(value) }));
      return;
    }
    if (name === "whatsappNumber") {
      setForm((prev) => ({ ...prev, whatsappNumber: formatWhatsappInput(value) }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.cnic.replace(/\D/g, "").length !== 13) {
      toast.error("CNIC must be 13 digits");
      return;
    }

    const waDigits = form.whatsappNumber.replace(/\D/g, "");
    const expectedLength = waDigits.startsWith("0") ? 11 : 10;
    if (waDigits.length !== expectedLength) {
      toast.error(
        waDigits.startsWith("0")
          ? "WhatsApp number must be 11 digits (starting with 0)"
          : "WhatsApp number must be 10 digits"
      );
      return;
    }

    const normalizedWhatsapp = normalizeWhatsapp(form.whatsappNumber);

    setLoading(true);
    try {
      const { data } = await axios.post("/api/auth/vendor", {
        action: "register",
        vendorName: form.vendorName,
        shopName: form.shopName,
        email: form.email,
        password: form.password,
        cnic: form.cnic,
        whatsappNumber: normalizedWhatsapp,
      });
      if (data.success) {
        dispatch(setVendor(data.vendor));
        toast.success(`Shop registered! Your Shop ID is ${data.vendor.shopId}`);
        router.push("/vendor/dashboard");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6 text-center" style={{ color: "#1A1A1A" }}>
        Become a Vendor
      </h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white border rounded-xl p-6"
        style={{ borderColor: "#C7D8EA" }}
      >
        <Input label="Your Name" name="vendorName" value={form.vendorName} onChange={handleChange} required />
        <Input label="Shop Name" name="shopName" value={form.shopName} onChange={handleChange} required />
        <Input label="Email" type="email" name="email" value={form.email} onChange={handleChange} required />
        <Input label="Password" type="password" name="password" value={form.password} onChange={handleChange} required />
        <Input
          label="CNIC"
          name="cnic"
          value={form.cnic}
          onChange={handleChange}
          placeholder="12345-1234567-1"
          inputMode="numeric"
          maxLength={15}
          required
        />
        <Input
          label="WhatsApp Number"
          name="whatsappNumber"
          value={form.whatsappNumber}
          onChange={handleChange}
          placeholder="03001234567 or 3001234567"
          inputMode="numeric"
          maxLength={11}
          required
        />

        <Button type="submit" disabled={loading} className="w-full mt-2">
          {loading ? "Creating shop..." : "Register Shop"}
        </Button>

        <p className="text-sm text-center mt-4" style={{ color: "#5D8DC2" }}>
          Already a vendor?{" "}
          <Link href="/vendor/login" className="font-medium" style={{ color: "#316EB2" }}>
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}