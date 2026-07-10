export default function ShopAvatar({ shopName, logoUrl, size = 48 }) {
  const initial = shopName?.trim()?.charAt(0)?.toUpperCase() || "S";

  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={shopName}
        style={{ width: size, height: size }}
        className="rounded-full object-cover border border-gray-200 dark:border-gray-800 flex-shrink-0"
      />
    );
  }

  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      className="rounded-full bg-gradient-to-br from-purple-600 to-pink-500 text-white font-bold flex items-center justify-center flex-shrink-0"
    >
      {initial}
    </div>
  );
}