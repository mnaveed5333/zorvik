export default function VendorDetails({ vendor }) {
  const detailRow = (label, value) => (
    <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex items-center justify-between">
      <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400">{value || "—"}</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {detailRow("Shop Name", vendor.shopName)}
      {detailRow("Vendor Name", vendor.vendorName)}
      {detailRow("Email", vendor.email)}
      {detailRow("CNIC", vendor.cnic)}
      {detailRow("WhatsApp Number", vendor.whatsappNumber)}
      {detailRow("Shop ID", vendor.shopId)}
    </div>
  );
}