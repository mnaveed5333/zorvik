import HeroSection from "@/components/customer/HeroSection";
import CategoryGrid from "@/components/customer/CategoryGrid";
import TopVendors from "@/components/customer/TopVendors";
import TrendingProducts from "@/components/customer/TrendingProducts";
import { WhyZorvik, VendorCTA } from "@/components/customer/TrustAndVendorCTA";

// Fetch this server-side (getServerSideProps equivalent / server component fetch)
// e.g. const products = await getTrendingProducts();

export default function HomePage() {
  return (
    <main className="min-h-screen w-full bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="pt-6">
          <HeroSection />
        </div>

        <CategoryGrid />
        <TopVendors />
        <TrendingProducts />
        <WhyZorvik />
        <VendorCTA />
      </div>
    </main>
  );
}