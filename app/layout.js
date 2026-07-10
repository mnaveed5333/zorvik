import "./globals.css";
import { ThemeProvider } from "next-themes";
import ReduxProvider from "@/components/shared/ReduxProvider";
import ToastProvider from "@/components/shared/ToastProvider";

export const metadata = {
  title: "Zorvik - Multi-Vendor Marketplace",
  description: "Shop from multiple vendors, order directly via WhatsApp.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <ReduxProvider>
            {children}
            <ToastProvider />
          </ReduxProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}