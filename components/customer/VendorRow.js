import Link from "next/link";
import ShopAvatar from "@/components/shared/ShopAvatar";

export default function VendorRow({ vendor }) {
  return (
    <div className="flex items-center justify-between gap-4 bg-white border border-[#C7D8EA] rounded-xl p-4 hover:border-[#5D8DC2] transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <ShopAvatar shopName={vendor.shopName} logoUrl={vendor.shopLogo?.url} size={48} />
        <div className="min-w-0">
          <p className="font-medium text-[#1A1A1A] truncate">{vendor.shopName}</p>
          <p className="text-xs text-[#5D8DC2]">{vendor.shopId}</p>
        </div>
      </div>

      <Link
        href={`/vendor/${vendor._id}`}
        className="text-sm px-4 py-2 rounded-lg bg-[#316EB2] hover:bg-[#EC3237] text-white whitespace-nowrap transition-colors"
      >
        View All Products
      </Link>
    </div>
  );
}