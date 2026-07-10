export default function Button({
  children,
  onClick,
  type = "button",
  variant = "primary",
  className = "",
  disabled = false,
}) {
  const baseStyles =
    "px-5 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary: "bg-[#EC3237] text-white hover:opacity-90 shadow-md hover:shadow-lg",
    secondary: "bg-[#5D8DC2] text-white hover:opacity-90 shadow-sm hover:shadow-md",
    outline: "border-2 border-[#316EB2] text-[#316EB2] hover:bg-[#C7D8EA]/40",
    danger: "bg-red-600 text-white hover:bg-red-700",
    whatsapp: "bg-green-500 text-white hover:bg-green-600 shadow-md hover:shadow-lg",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}