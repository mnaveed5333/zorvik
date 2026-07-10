export default function Input({
  label,
  type = "text",
  name,
  value,
  onChange,
  placeholder = "",
  required = false,
  error = "",
  className = "",
}) {
  return (
    <div className="w-full mb-4">
      {label && (
        <label htmlFor={name} className="block text-sm font-medium mb-1.5 text-[#1A1A1A]">
          {label} {required && <span className="text-[#EC3237]">*</span>}
        </label>
      )}
      <input
        id={name}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        autoComplete="off"
        className={`w-full px-4 py-2.5 rounded-lg border ${
          error ? "border-[#EC3237]" : "border-[#C7D8EA]"
        } bg-white text-[#1A1A1A] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#316EB2] focus:border-[#316EB2] transition-all autofill:bg-white autofill:text-[#1A1A1A] [&:-webkit-autofill]:!bg-white [&:-webkit-autofill]:![-webkit-text-fill-color:#1A1A1A] [&:-webkit-autofill]:![transition:background-color_9999s_ease-in-out_0s] ${className}`}
      />
      {error && <p className="text-[#EC3237] text-xs mt-1">{error}</p>}
    </div>
  );
}