"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import axios from "axios";
import toast from "react-hot-toast";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { setAdmin } from "@/redux/slices/authSlice";

export default function AdminLoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const router = useRouter();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.post("/api/auth/admin", form);
      if (data.success) {
        dispatch(setAdmin(data.admin));
        toast.success("Welcome back!");
        router.push("/admin/dashboard");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6 text-center" style={{ color: "#1A1A1A" }}>
        Admin Login
      </h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white border rounded-xl p-6"
        style={{ borderColor: "#C7D8EA" }}
      >
        <Input label="Email" type="email" name="email" value={form.email} onChange={handleChange} required />
        <Input label="Password" type="password" name="password" value={form.password} onChange={handleChange} required />

        <Button type="submit" disabled={loading} className="w-full mt-2">
          {loading ? "Logging in..." : "Login"}
        </Button>
      </form>
    </div>
  );
}