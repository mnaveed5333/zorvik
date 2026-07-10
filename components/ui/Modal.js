"use client";

import { X } from "lucide-react";

export default function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:hover:text-white"
          aria-label="Close modal"
        >
          <X size={20} />
        </button>
        {title && <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">{title}</h2>}
        <div>{children}</div>
      </div>
    </div>
  );
}