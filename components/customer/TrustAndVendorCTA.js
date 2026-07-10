"use client";

import Link from "next/link";
import { IconShieldCheck, IconBrandWhatsapp, IconLock, IconTruck } from "@tabler/icons-react";

const trustPoints = [
  {
    icon: IconShieldCheck,
    title: "Verified Vendors",
    desc: "Every store is reviewed before it goes live",
  },
  {
    icon: IconBrandWhatsapp,
    title: "WhatsApp Ordering",
    desc: "Order directly, no account needed",
  },
  {
    icon: IconLock,
    title: "Secure Checkout",
    desc: "Your data and payments are protected",
  },
  {
    icon: IconTruck,
    title: "Fast Delivery",
    desc: "Vendors ship quickly across Pakistan",
  },
];

export function WhyZorvik() {
  return (
    <section className="w-full py-8">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">Why Zorvik</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {trustPoints.map((point) => {
          const Icon = point.icon;
          return (
            <div
              key={point.title}
              className="flex flex-col items-start gap-2 rounded-xl border border-[#C7D8EA] bg-white p-4"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#C7D8EA]">
                <Icon size={20} stroke={1.75} className="text-[#316EB2]" />
              </div>
              <p className="text-sm font-semibold text-gray-900">{point.title}</p>
              <p className="text-xs text-gray-500">{point.desc}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function VendorCTA() {
  return (
    <section className="w-full py-8">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 rounded-2xl bg-[#316EB2] p-6 md:p-8">
        <div className="text-center md:text-left">
          <h3 className="text-lg md:text-xl font-semibold text-white">
            Have products to sell?
          </h3>
          <p className="mt-1 text-sm text-white/85">
            Join Zorvik as a vendor and reach thousands of buyers.
          </p>
        </div>
        <Link
          href="/vendor/register"
          className="whitespace-nowrap rounded-lg bg-white px-6 py-2.5 text-sm font-semibold text-[#316EB2] transition-colors hover:bg-[#C7D8EA]"
        >
          Become a Vendor
        </Link>
      </div>
    </section>
  );
}