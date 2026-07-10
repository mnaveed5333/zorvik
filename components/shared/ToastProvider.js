"use client";

import { Toaster } from "react-hot-toast";

export default function ToastProvider() {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        duration: 3000,
        style: {
          background: "var(--toast-bg, #1a1a1a)",
          color: "var(--toast-text, #fff)",
          borderRadius: "10px",
          padding: "12px 16px",
        },
        success: {
          iconTheme: {
            primary: "#a855f7",
            secondary: "#fff",
          },
        },
        error: {
          iconTheme: {
            primary: "#ec4899",
            secondary: "#fff",
          },
        },
      }}
    />
  );
}