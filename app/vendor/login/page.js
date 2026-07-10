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

export default function VendorLoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const router = useRouter();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.post("/api/auth/vendor", {
        action: "login",
        ...form,
      });
      if (data.success) {
        dispatch(setVendor(data.vendor));
        toast.success("Welcome back!");
        router.push("/vendor/dashboard");
      }
    } catch (error) {
      const responseData = error.response?.data;

      if (responseData?.suspended) {
        toast.error("Your account has been suspended.");
        router.push("/vendor/suspended");
        return;
      }

      toast.error(responseData?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6 text-center" style={{ color: "#1A1A1A" }}>
        Vendor Login
      </h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white border rounded-xl p-6"
        style={{ borderColor: "#C7D8EA" }}
      >
        <Input
          label="Email"
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          required
        />
        <Input
          label="Password"
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          required
        />

        <Button type="submit" disabled={loading} className="w-full mt-2">
          {loading ? "Logging in..." : "Login"}
        </Button>

        <p className="text-sm text-center mt-4" style={{ color: "#5D8DC2" }}>
          New vendor?{" "}
          <Link href="/vendor/register" className="font-medium" style={{ color: "#316EB2" }}>
            Register your shop
          </Link>
        </p>
      </form>
    </div>
  );
}