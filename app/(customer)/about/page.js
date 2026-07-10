export default function AboutPage() {
  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16 text-center">

        {/* Eyebrow */}
        <p className="text-xs font-semibold tracking-widest uppercase text-[#EC3237] mb-3">
          Our Story
        </p>

        <h1 className="text-3xl sm:text-4xl font-bold text-[#1A1A1A] mb-6">
          About Zorvik
        </h1>

        {/* 1:1 image */}
        <div className="w-full max-w-sm mx-auto aspect-square rounded-2xl overflow-hidden border border-[#C7D8EA] mb-10 bg-[#C7D8EA]/20">
          <img
            src="/about.png"
            alt="Zorvik marketplace"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="space-y-5 max-w-2xl mx-auto">
          <p className="text-[#333] text-base leading-relaxed">
            Zorvik is a multi-vendor marketplace that connects customers directly with
            independent shop owners. Instead of routing every order through a centralized
            payment system, Zorvik lets you browse products from many vendors and finalize
            your order directly with the vendor over WhatsApp — fast, personal, and
            transparent.
          </p>
          <p className="text-[#333] text-base leading-relaxed">
            Vendors get their own dashboard to manage products and orders, while customers
            enjoy a single place to discover everything from fashion to electronics.
          </p>
        </div>

        {/* Feature strip */}
        <div className="grid sm:grid-cols-3 gap-4 mt-12">
          <div className="bg-[#C7D8EA]/20 border border-[#C7D8EA] rounded-xl p-5 text-center">
            <p className="text-[#316EB2] font-semibold text-sm mb-1">Direct to Vendor</p>
            <p className="text-[#5D8DC2] text-xs leading-relaxed">
              No middleman payment layer — talk to the shop owner directly on WhatsApp.
            </p>
          </div>
          <div className="bg-[#C7D8EA]/20 border border-[#C7D8EA] rounded-xl p-5 text-center">
            <p className="text-[#316EB2] font-semibold text-sm mb-1">One Marketplace</p>
            <p className="text-[#5D8DC2] text-xs leading-relaxed">
              Fashion, electronics, and everything between, from independent sellers.
            </p>
          </div>
          <div className="bg-[#C7D8EA]/20 border border-[#C7D8EA] rounded-xl p-5 text-center">
            <p className="text-[#316EB2] font-semibold text-sm mb-1">Built for Vendors</p>
            <p className="text-[#5D8DC2] text-xs leading-relaxed">
              A dedicated dashboard to manage products and orders with ease.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}