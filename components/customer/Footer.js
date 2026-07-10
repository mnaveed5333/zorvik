import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-white text-[#1A1A1A] border-t border-[#C7D8EA] mt-16">
      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div>
          <h3 className="text-xl font-bold text-[#316EB2] mb-3">
            Zorvik<span className="text-[#EC3237]">.</span>
          </h3>
          <p className="text-sm text-gray-500">
            Your multi-vendor marketplace — order directly via WhatsApp.
          </p>
        </div>

        <div>
          <h4 className="font-semibold text-[#316EB2] mb-3">Company</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/about" className="text-[#1A1A1A] hover:text-[#EC3237] transition-colors">About Us</Link></li>
            <li><Link href="/contact" className="text-[#1A1A1A] hover:text-[#EC3237] transition-colors">Contact Us</Link></li>
          </ul>
        </div>

        <div>
  <h4 className="font-semibold text-[#316EB2] mb-3">Shop</h4>
  <ul className="space-y-2 text-sm">
    <li>
      <Link
        href="/shop"
        className="text-[#1A1A1A] hover:text-[#EC3237] transition-colors"
      >
        All Products
      </Link>
    </li>

    <li>
      <Link
        href="/stores"
        className="text-[#1A1A1A] hover:text-[#EC3237] transition-colors"
      >
        All Stores
      </Link>
    </li>
  </ul>
</div>

        <div>
          <h4 className="font-semibold text-[#316EB2] mb-3">Sell on Zorvik</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/vendor/register" className="text-[#1A1A1A] hover:text-[#EC3237] transition-colors">Become a Vendor</Link></li>
            <li><Link href="/vendor/login" className="text-[#1A1A1A] hover:text-[#EC3237] transition-colors">Vendor Login</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-[#C7D8EA] py-4 text-center text-sm text-gray-500">
        © {new Date().getFullYear()}{" "}
        <Link
          href="/admin/login"
          className="cursor-default no-underline hover:no-underline hover:text-gray-500 text-gray-500"
        >
          Zorvik
        </Link>
        . All rights reserved.
      </div>
    </footer>
  );
}