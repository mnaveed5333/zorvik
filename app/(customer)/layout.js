import Navbar from "@/components/customer/Navbar";
import Footer from "@/components/customer/Footer";

export default function CustomerLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">{children}</main>
      <Footer />
    </div>
  );
}