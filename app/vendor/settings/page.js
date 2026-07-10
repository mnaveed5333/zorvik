"use client";

import { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import toast from "react-hot-toast";
import { Pencil, Clock, X, Loader2, Store, KeyRound, Phone } from "lucide-react";
import { setVendor, mergeVendor } from "@/redux/slices/authSlice";
import ShopAvatar from "@/components/shared/ShopAvatar";

const REFRESH_INTERVAL = 5000;

function formatCNIC(value) {
  const digits = value.replace(/\D/g, "").slice(0, 13);
  if (digits.length <= 5) return digits;
  if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
}

function formatWhatsapp(value) {
  let digits = value.replace(/\D/g, "");
  if (!digits.startsWith("92")) digits = "92" + digits;
  return "92" + digits.slice(2).slice(0, 10);
}

const REQUEST_FIELDS = [
  { key: "shopName", label: "Shop Name", requestAction: "requestShopName" },
  { key: "vendorName", label: "Vendor Name", requestAction: "requestVendorName" },
  { key: "email", label: "Email", requestAction: "requestEmail" },
  { key: "cnic", label: "CNIC", requestAction: "requestCnic", formatter: formatCNIC },
];

const TABS = [
  { id: "profile", label: "Shop Profile", icon: Store },
  { id: "contact", label: "Contact", icon: Phone },
  { id: "security", label: "Security", icon: KeyRound },
];

export default function VendorSettingsPage() {
  const dispatch = useDispatch();
  const vendor = useSelector((state) => state.auth.vendor);
  const vendorId = vendor?.id || vendor?._id;

  const [activeTab, setActiveTab] = useState("profile");
  const [inputs, setInputs] = useState({});
  const [saving, setSaving] = useState("");
  const [whatsappInput, setWhatsappInput] = useState(vendor?.whatsappNumber || "92");
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "" });
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef(null);

  const savingRef = useRef(saving);
  savingRef.current = saving;

  useEffect(() => {
    if (!vendorId) return;
    let cancelled = false;

    const refresh = async () => {
      if (savingRef.current) return;
      try {
        const { data } = await axios.get("/api/vendors/me");
        if (!cancelled && data.success && data.vendor) {
          dispatch(setVendor(data.vendor));
        }
      } catch (error) {
        console.error("Settings background refresh error:", error);
      }
    };

    const interval = setInterval(refresh, REFRESH_INTERVAL);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [vendorId, dispatch]);

  if (!vendor) return <p className="text-center py-12 text-[#1A1A1A]">Please log in as a vendor.</p>;

  const setInputValue = (key, value) => setInputs((prev) => ({ ...prev, [key]: value }));

  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleLogoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }

    setUploadingLogo(true);
    try {
      const fileBase64 = await fileToBase64(file);
      const { data: uploadData } = await axios.post("/api/upload", { fileBase64, folder: "shop-logos" });

      if (!uploadData.success) {
        toast.error("Logo upload failed");
        return;
      }

      if (vendor.shopLogo?.publicId) {
        axios.delete("/api/upload", { data: { publicId: vendor.shopLogo.publicId } }).catch(() => {});
      }

      const { data } = await axios.put("/api/vendors", {
        vendorId,
        action: "updateProfile",
        shopLogo: { url: uploadData.url, publicId: uploadData.publicId },
      });

      if (data.success) {
        dispatch(mergeVendor(data.vendor));
        toast.success("Shop logo updated");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Logo update failed");
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const submitRequest = async (field, requestAction) => {
    const value = inputs[field];
    if (!value || !value.trim()) {
      toast.error("Please enter a value");
      return;
    }
    if (field === "cnic" && value.replace(/\D/g, "").length !== 13) {
      toast.error("CNIC must be 13 digits");
      return;
    }
    setSaving(field);
    try {
      const { data } = await axios.put(
        "/api/vendors",
        { vendorId, action: requestAction, [field]: value.trim() },
        { timeout: 15000 }
      );
      if (data.success) {
        dispatch(mergeVendor(data.vendor));
        setInputValue(field, "");
        toast.success("Change request sent for admin approval");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Request failed");
    } finally {
      setSaving("");
    }
  };

  const cancelRequest = async (field) => {
    setSaving(`cancel-${field}`);
    try {
      const { data } = await axios.put(
        "/api/vendors",
        { vendorId, action: "cancelRequest", field },
        { timeout: 15000 }
      );
      if (data.success) {
        dispatch(mergeVendor(data.vendor));
        toast.success("Request cancelled");
      }
    } catch {
      toast.error("Failed to cancel request");
    } finally {
      setSaving("");
    }
  };

  const saveWhatsapp = async () => {
    if (whatsappInput.replace(/\D/g, "").length !== 12) {
      toast.error("WhatsApp number must be 92 followed by 10 digits");
      return;
    }
    setSaving("whatsapp");
    try {
      const { data } = await axios.put(
        "/api/vendors",
        { vendorId, action: "updateProfile", whatsappNumber: whatsappInput },
        { timeout: 15000 }
      );
      if (data.success) {
        dispatch(mergeVendor(data.vendor));
        toast.success("WhatsApp number updated");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Update failed");
    } finally {
      setSaving("");
    }
  };

  const changePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      toast.error("Both password fields are required");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    setSaving("password");
    try {
      const { data } = await axios.put(
        "/api/vendors",
        { vendorId, action: "changePassword", ...passwordForm },
        { timeout: 15000 }
      );
      if (data.success) {
        setPasswordForm({ currentPassword: "", newPassword: "" });
        toast.success("Password changed");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Password change failed");
    } finally {
      setSaving("");
    }
  };

  const spinner = <Loader2 size={12} className="animate-spin" />;

  const detailRow = (label, value) => (
    <div className="border border-[#C7D8EA] rounded-xl p-4 flex items-center justify-between">
      <p className="text-sm font-medium text-[#1A1A1A]">{label}</p>
      <p className="text-sm text-[#5D8DC2]">{value || "—"}</p>
    </div>
  );

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-bold text-[#1A1A1A] mb-6">Vendor Settings</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-[#C7D8EA]">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === id
                ? "border-[#EC3237] text-[#EC3237]"
                : "border-transparent text-[#5D8DC2] hover:text-[#316EB2]"
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {activeTab === "profile" && (
        <div className="space-y-6">
          <div className="border border-[#C7D8EA] rounded-xl p-4 flex items-center gap-4">
            <ShopAvatar shopName={vendor.shopName} logoUrl={vendor.shopLogo?.url} size={56} />
            <div className="flex-1">
              <p className="text-sm font-medium text-[#1A1A1A] mb-1">Shop Logo</p>
              <p className="text-xs text-[#5D8DC2] mb-2">
                Shown to customers on your storefront. Updates instantly — no admin approval needed.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                disabled={uploadingLogo}
                className="hidden"
                id="logo-upload"
              />
              <label
                htmlFor="logo-upload"
                className={`inline-block text-xs px-4 py-2 rounded-lg bg-[#316EB2] text-white hover:opacity-90 cursor-pointer ${
                  uploadingLogo ? "opacity-50 pointer-events-none" : ""
                }`}
              >
                {uploadingLogo ? "Uploading..." : "Change Logo"}
              </label>
            </div>
          </div>

          <div className="space-y-3">
            {detailRow("Shop ID", vendor.shopId)}
            {detailRow("Shop Name", vendor.shopName)}
            {detailRow("Vendor Name", vendor.vendorName)}
            {detailRow("Email", vendor.email)}
            {detailRow("CNIC", vendor.cnic)}
          </div>

          <p className="text-xs text-[#5D8DC2]">
            Shop name, vendor name, email, and CNIC changes need admin approval.
          </p>

          {REQUEST_FIELDS.map(({ key, label, requestAction, formatter }) => {
            const pendingValue = vendor[`pending${key.charAt(0).toUpperCase() + key.slice(1)}`];
            const status = vendor[`${key}Status`];

            return (
              <div key={key} className="border border-[#C7D8EA] rounded-xl p-4 space-y-2">
                <p className="text-sm font-medium text-[#1A1A1A]">{label}</p>
                <p className="text-xs text-[#5D8DC2]">Current: {vendor[key] || "—"}</p>

                {status === "pending" ? (
                  <div className="flex items-center justify-between bg-[#EC3237]/10 border border-[#EC3237]/30 rounded-lg px-3 py-2 text-sm">
                    <span className="flex items-center gap-1.5 text-[#EC3237]">
                      <Clock size={14} /> Pending: <strong>{pendingValue}</strong>
                    </span>
                    <button
                      onClick={() => cancelRequest(key)}
                      disabled={saving === `cancel-${key}`}
                      className="p-1 bg-[#EC3237]/10 text-[#EC3237] rounded flex items-center"
                    >
                      {saving === `cancel-${key}` ? spinner : <X size={12} />}
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type={key === "email" ? "email" : "text"}
                      inputMode={key === "cnic" ? "numeric" : undefined}
                      maxLength={key === "cnic" ? 15 : undefined}
                      autoComplete="off"
                      name={`${key}-request`}
                      disabled={saving === key}
                      className="flex-1 border border-[#C7D8EA] bg-white rounded-lg px-3 py-2 text-sm text-[#1A1A1A] disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#316EB2]/30 focus:border-[#316EB2]"
                      placeholder={key === "cnic" ? "12345-1234567-1" : `New ${label.toLowerCase()}`}
                      value={inputs[key] || ""}
                      onChange={(e) => setInputValue(key, formatter ? formatter(e.target.value) : e.target.value)}
                    />
                    <button
                      onClick={() => submitRequest(key, requestAction)}
                      disabled={saving === key}
                      className="text-xs px-4 py-2 bg-[#316EB2] text-white rounded-lg hover:opacity-90 disabled:opacity-50 whitespace-nowrap flex items-center gap-1.5"
                    >
                      {saving === key && spinner}
                      Request Change
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "contact" && (
        <div className="border border-[#C7D8EA] rounded-xl p-4 space-y-3">
          <p className="text-sm font-medium text-[#1A1A1A]">WhatsApp Number</p>
          <p className="text-xs text-[#5D8DC2]">Updates instantly, no approval needed.</p>
          <input
            autoComplete="off"
            name="vendor-whatsapp"
            inputMode="numeric"
            maxLength={12}
            disabled={saving === "whatsapp"}
            className="w-full border border-[#C7D8EA] bg-white rounded-lg px-3 py-2 text-sm text-[#1A1A1A] disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#316EB2]/30 focus:border-[#316EB2]"
            placeholder="923001234567"
            value={whatsappInput}
            onChange={(e) => setWhatsappInput(formatWhatsapp(e.target.value))}
          />
          <button
            onClick={saveWhatsapp}
            disabled={saving === "whatsapp"}
            className="text-xs px-4 py-2 bg-[#EC3237] text-white rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5"
          >
            {saving === "whatsapp" && spinner}
            Save
          </button>
        </div>
      )}

      {activeTab === "security" && (
        <div className="border border-[#C7D8EA] rounded-xl p-4 space-y-3">
          <p className="text-sm font-medium text-[#1A1A1A]">Change Password</p>
          <input
            type="password"
            autoComplete="new-password"
            disabled={saving === "password"}
            className="w-full border border-[#C7D8EA] bg-white rounded-lg px-3 py-2 text-sm text-[#1A1A1A] disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#316EB2]/30 focus:border-[#316EB2]"
            placeholder="Current Password"
            value={passwordForm.currentPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
          />
          <input
            type="password"
            autoComplete="new-password"
            disabled={saving === "password"}
            className="w-full border border-[#C7D8EA] bg-white rounded-lg px-3 py-2 text-sm text-[#1A1A1A] disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#316EB2]/30 focus:border-[#316EB2]"
            placeholder="New Password (min 6 chars)"
            value={passwordForm.newPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
          />
          <button
            onClick={changePassword}
            disabled={saving === "password"}
            className="text-xs px-4 py-2 bg-[#316EB2] text-white rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5"
          >
            {saving === "password" && spinner}
            Update Password
          </button>
        </div>
      )}
    </div>
  );
}