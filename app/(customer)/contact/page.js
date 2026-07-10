"use client";

import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { MessageCircle } from "lucide-react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [whatsappLocal, setWhatsappLocal] = useState(""); // shown exactly as typed, up to 11 digits
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Customer can type either 10 digits (3001234567) or 11 with a leading zero
  // (03001234567) — the input shows exactly what they typed, but the leading
  // zero is dropped only when we build the actual number used for the payload/preview.
  const isWhatsappValid =
    whatsappLocal.length === 10 || (whatsappLocal.length === 11 && whatsappLocal.startsWith("0"));

  const normalizedWhatsappLocal =
    whatsappLocal.length === 11 && whatsappLocal.startsWith("0")
      ? whatsappLocal.slice(1)
      : whatsappLocal;

  const whatsapp = `92${normalizedWhatsappLocal}`;

  const handleWhatsappChange = (e) => {
    const raw = e.target.value.replace(/\D/g, "");
    const max = raw.startsWith("0") ? 11 : 10;
    setWhatsappLocal(raw.slice(0, max));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isWhatsappValid) {
      toast.error("Enter 10 digits, or 11 digits starting with 0");
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await axios.post("/api/queries", {
        name,
        whatsappNumber: whatsapp,
        message,
      });

      if (data.success) {
        toast.success("Message sent! We'll get back to you soon.");
        setName("");
        setWhatsappLocal("");
        setMessage("");
      } else {
        toast.error(data.message || "Something went wrong");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send message");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Hero header */}
      <div className="bg-[#C7D8EA]/30 border-b border-[#C7D8EA]">
        <div className="max-w-3xl mx-auto px-4 py-14 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-3">
            Get in Touch
          </h1>
          <p className="text-gray-600 max-w-md mx-auto">
            Have a question about an order, a shop, or becoming a vendor? Send us a message on WhatsApp and we'll get back to you.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-md mx-auto px-4 py-12">
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-[#C7D8EA] rounded-xl p-6 shadow-sm"
        >
          <Input
            label="Name"
            name="name"
            placeholder="Your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div className="w-full mb-4">
            <label className="block text-sm font-medium mb-1.5 text-[#1A1A1A]">
              WhatsApp Number <span className="text-[#EC3237]">*</span>
            </label>
            <div className="flex items-center border border-[#C7D8EA] rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-[#316EB2] focus-within:border-[#316EB2]">
              <span className="flex items-center gap-1.5 px-3 py-2.5 bg-[#C7D8EA]/40 text-[#1A1A1A] font-medium border-r border-[#C7D8EA] shrink-0">
                <MessageCircle size={16} className="text-green-500" />
                +92
              </span>
              <input
                type="tel"
                inputMode="numeric"
                value={whatsappLocal}
                onChange={handleWhatsappChange}
                placeholder="3001234567 or 03001234567"
                maxLength={11}
                required
                className="w-full px-3 py-2.5 bg-white text-[#1A1A1A] placeholder:text-gray-400 focus:outline-none"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Enter 10 digits, or 11 digits starting with 0
            </p>
            {isWhatsappValid && (
              <p className="text-xs mt-1 font-medium" style={{ color: "#316EB2" }}>
                We'll contact you at: +{whatsapp}
              </p>
            )}
          </div>

          <div className="w-full mb-4">
            <label className="block text-sm font-medium mb-1.5 text-[#1A1A1A]">
              Message <span className="text-[#EC3237]">*</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              required
              placeholder="Write your message here..."
              className="w-full px-4 py-2.5 rounded-lg border border-[#C7D8EA] bg-white text-[#1A1A1A] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#316EB2] focus:border-[#316EB2]"
            />
          </div>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Sending..." : "Send Message"}
          </Button>
        </form>
      </div>
    </div>
  );
}