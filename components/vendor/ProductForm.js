"use client";

import { useState, useEffect, useRef } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { X, Plus, Star, ImagePlus, Loader2, Video, PlayCircle, Pipette } from "lucide-react";
import { COMMON_COLORS, getColorName } from "@/utils/colorNames";

const DEFAULT_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const RECENT_COLORS_KEY = "productForm:recentColors";
const MAX_RECENT_COLORS = 20;
const MAX_IMAGES_WITH_VIDEO = 3;
const MAX_IMAGES_WITHOUT_VIDEO = 4;
const MAX_VIDEO_SECONDS = 20;

function loadRecentColors() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_COLORS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRecentColor(hex) {
  if (typeof window === "undefined") return [];
  try {
    const existing = loadRecentColors().filter((c) => c.toLowerCase() !== hex.toLowerCase());
    const updated = [hex, ...existing].slice(0, MAX_RECENT_COLORS);
    window.localStorage.setItem(RECENT_COLORS_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

// Reads video duration client-side before uploading, so a 45s clip never
// even reaches the network. Uses a throwaway <video> + object URL.
function getVideoDuration(file) {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    const objectUrl = URL.createObjectURL(file);
    video.src = objectUrl;

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(video.duration);
    };
    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not read video file"));
    };
  });
}

function Section({ title, hint, children }) {
  return (
    <div className="w-full bg-white rounded-2xl border border-[#C7D8EA] p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-[#316EB2] tracking-wide">{title}</h3>
        {hint && <span className="text-xs text-[#5D8DC2]">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function SizePoolBuilder({ pool, onAdd, onRemove }) {
  const [customSize, setCustomSize] = useState("");

  const addCustom = () => {
    const val = customSize.trim();
    if (!val) return;
    onAdd(val);
    setCustomSize("");
  };

  return (
    <div className="w-full">
      <p className="text-xs font-medium text-[#5D8DC2] mb-2">Available Sizes</p>
      <div className="flex flex-wrap gap-2 mb-3">
        {DEFAULT_SIZES.map((size) => {
          const added = pool.includes(size);
          return (
            <button
              key={size}
              type="button"
              onClick={() => (added ? onRemove(size) : onAdd(size))}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                added
                  ? "bg-[#316EB2] text-white border-[#316EB2]"
                  : "bg-white text-[#1A1A1A] border-[#C7D8EA] hover:border-[#316EB2]"
              }`}
            >
              {size}
            </button>
          );
        })}
      </div>

      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={customSize}
          onChange={(e) => setCustomSize(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCustom();
            }
          }}
          placeholder="Custom size, e.g. 42, One Size"
          className="flex-1 px-3 py-2 rounded-lg border border-[#C7D8EA] bg-white text-[#1A1A1A] placeholder:text-[#5D8DC2] text-sm focus:outline-none focus:ring-2 focus:ring-[#316EB2]/30 focus:border-[#316EB2]"
        />
        <button
          type="button"
          onClick={addCustom}
          className="flex items-center gap-1 px-3 rounded-lg bg-white border border-[#C7D8EA] text-[#1A1A1A] text-sm font-medium hover:bg-[#C7D8EA]/40 transition-colors"
        >
          <Plus size={14} /> Add
        </button>
      </div>

      {pool.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {pool.map((size) => (
            <span key={size} className="flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-full text-xs font-medium bg-[#316EB2]/10 text-[#316EB2]">
              {size}
              <button type="button" onClick={() => onRemove(size)} className="hover:opacity-60">
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// Color picker: quick-pick swatches, recently used, native color input,
// and a screen-wide eyedropper (EyeDropper API) so a color can be sampled
// from ANYWHERE on the page/screen — no matter how far the user has
// scrolled up or down before opening the picker.
function ColorPoolBuilder({ pool, onAdd, onRemove }) {
  const [customHex, setCustomHex] = useState("#316EB2");
  const [recent, setRecent] = useState([]);
  const [eyeDropperSupported, setEyeDropperSupported] = useState(false);
  const [picking, setPicking] = useState(false);

  useEffect(() => {
    setRecent(loadRecentColors());
    setEyeDropperSupported(typeof window !== "undefined" && "EyeDropper" in window);
  }, []);

  const addColor = (hex) => {
    const normalized = hex.trim();
    if (!normalized || pool.some((c) => c.toLowerCase() === normalized.toLowerCase())) return;
    onAdd(normalized);
    setRecent(saveRecentColor(normalized) || recent);
  };

  // Opens the browser's native eyedropper overlay. It works across the
  // ENTIRE screen (not just this component or even this tab's viewport),
  // so scroll position on the page never limits where a color can be
  // sampled from.
  const handleEyeDropper = async () => {
    if (!eyeDropperSupported) {
      toast.error("Eyedropper isn't supported in this browser — try Chrome or Edge");
      return;
    }
    try {
      setPicking(true);
      const eyeDropper = new window.EyeDropper();
      const result = await eyeDropper.open();
      if (result?.sRGBHex) {
        setCustomHex(result.sRGBHex);
        addColor(result.sRGBHex);
        toast.success(`Picked ${getColorName(result.sRGBHex)}`);
      }
    } catch {
      // User pressed Escape / cancelled — no-op
    } finally {
      setPicking(false);
    }
  };

  return (
    <div className="w-full">
      <p className="text-xs font-medium text-[#5D8DC2] mb-1.5">Quick Pick</p>
      <div className="flex flex-wrap gap-2 mb-3">
        {COMMON_COLORS.map((c) => {
          const added = pool.some((p) => p.toLowerCase() === c.hex.toLowerCase());
          return (
            <button
              key={c.hex}
              type="button"
              title={c.name}
              onClick={() => (added ? onRemove(c.hex) : addColor(c.hex))}
              className={`w-7 h-7 rounded-full border transition-transform hover:scale-110 ${
                added ? "ring-2 ring-offset-2 ring-[#316EB2] border-transparent" : "border-[#C7D8EA]"
              }`}
              style={{ background: c.hex }}
            />
          );
        })}
      </div>

      {recent.length > 0 && (
        <>
          <p className="text-xs font-medium text-[#5D8DC2] mb-1.5">Recently Used</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {recent.map((hex) => (
              <button
                key={hex}
                type="button"
                title={getColorName(hex)}
                onClick={() => addColor(hex)}
                className="w-7 h-7 rounded-full border border-[#C7D8EA] transition-transform hover:scale-110"
                style={{ background: hex }}
              />
            ))}
          </div>
        </>
      )}

      <p className="text-xs font-medium text-[#5D8DC2] mb-1.5">Custom</p>
      <div className="flex gap-2 mb-3 items-center">
        <label className="relative shrink-0 w-9 h-9 rounded-lg border border-[#C7D8EA] overflow-hidden cursor-pointer">
          <span className="absolute inset-0" style={{ background: customHex }} />
          <input
            type="color"
            value={customHex}
            onChange={(e) => setCustomHex(e.target.value)}
            className="absolute -top-2 -left-2 w-14 h-14 cursor-pointer opacity-0"
          />
        </label>

        <p className="flex-1 px-3 py-2 rounded-lg border border-[#C7D8EA] bg-[#C7D8EA]/20 text-[#1A1A1A] text-sm truncate">
          {getColorName(customHex)}
        </p>

        <button
          type="button"
          onClick={handleEyeDropper}
          disabled={picking}
          title={eyeDropperSupported ? "Pick a color from anywhere on your screen" : "Eyedropper not supported in this browser"}
          className={`flex items-center justify-center w-9 h-9 shrink-0 rounded-lg border transition-colors ${
            eyeDropperSupported
              ? "bg-white border-[#C7D8EA] text-[#316EB2] hover:bg-[#C7D8EA]/40"
              : "bg-[#C7D8EA]/20 border-[#C7D8EA] text-[#5D8DC2] cursor-not-allowed"
          }`}
        >
          {picking ? <Loader2 size={14} className="animate-spin" /> : <Pipette size={14} />}
        </button>

        <button
          type="button"
          onClick={() => addColor(customHex)}
          className="flex items-center gap-1 px-3 h-9 rounded-lg bg-white border border-[#C7D8EA] text-[#1A1A1A] text-sm font-medium hover:bg-[#C7D8EA]/40 transition-colors shrink-0"
        >
          <Plus size={14} /> Add
        </button>
      </div>

      {pool.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {pool.map((hex) => (
            <span key={hex} title={getColorName(hex)} className="flex items-center gap-1.5 pl-1.5 pr-2 py-1 rounded-full text-xs font-medium bg-white border border-[#C7D8EA] text-[#1A1A1A]">
              <span className="w-3.5 h-3.5 rounded-full border border-[#C7D8EA]" style={{ background: hex }} />
              {getColorName(hex)}
              <button type="button" onClick={() => onRemove(hex)} className="hover:opacity-60">
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// Category dropdown — always has a search input so it stays usable
// whether there are 5 categories or 500.
function CategorySelect({ categories, value, onChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = query.trim()
    ? categories.filter((c) => c.name.toLowerCase().includes(query.trim().toLowerCase()))
    : categories;

  const selected = categories.find((c) => c._id === value);

  const handleSelect = (id) => {
    onChange(id);
    setOpen(false);
    setQuery("");
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full px-4 py-2.5 rounded-lg border border-[#C7D8EA] bg-white text-[#1A1A1A] text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-[#316EB2]/30 focus:border-[#316EB2]"
      >
        <span className={`truncate ${selected ? "" : "text-[#5D8DC2]"}`}>
          {selected ? selected.name : "Select category"}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-4 w-4 ml-2 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="#5D8DC2"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Hidden but focusable input so the browser's native "required" validation
          still works with this custom, non-<select> control */}
      <input
        tabIndex={-1}
        value={value || ""}
        onChange={() => {}}
        required
        className="absolute bottom-0 left-3 w-px h-px opacity-0 pointer-events-none"
      />

      {open && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-[#C7D8EA] bg-white shadow-lg">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search category..."
            className="w-full px-3 py-2 text-sm border-b border-[#C7D8EA] text-[#1A1A1A] outline-none"
          />

          <div className="max-h-56 overflow-y-auto">
            {filtered.map((cat) => (
              <div
                key={cat._id}
                onClick={() => handleSelect(cat._id)}
                className="px-4 py-2 text-sm cursor-pointer hover:bg-[#C7D8EA]/30"
                style={{ color: cat._id === value ? "#EC3237" : "#1A1A1A" }}
              >
                {cat.name}
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="px-4 py-3 text-sm text-center text-[#5D8DC2]">No matching category.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProductForm({ initialData = null, onSuccess }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  const [form, setForm] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    price: initialData?.price || "",
    category: initialData?.category?._id || "",
    images: initialData?.images || [],
    coverImage: initialData?.images?.[0]?.publicId || null,
    sizePool: initialData?.sizePool || [],
    colorPool: initialData?.colorPool || [],
    video: initialData?.video?.url ? initialData.video : null,
  });

  // Video presence changes the image cap: 3 with a video, 4 without.
  const maxImages = form.video ? MAX_IMAGES_WITH_VIDEO : MAX_IMAGES_WITHOUT_VIDEO;

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await axios.get("/api/categories");
      if (data.success) setCategories(data.categories);
    };
    fetchCategories();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (form.images.length + files.length > maxImages) {
      toast.error(
        form.video
          ? `Max ${maxImages} images allowed when a video is attached`
          : `Maximum ${maxImages} images allowed`
      );
      e.target.value = "";
      return;
    }

    setUploading(true);
    try {
      for (const file of files) {
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        const { data } = await axios.post("/api/upload", {
          fileBase64: base64,
          folder: "zorvik/products",
        });
        if (data.success) {
          setForm((prev) => ({
            ...prev,
            images: [...prev.images, { url: data.url, publicId: data.publicId }],
            coverImage: prev.coverImage || data.publicId,
          }));
        }
      }
    } catch {
      toast.error("Image upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const removeImage = (publicId) => {
    setForm((prev) => {
      const images = prev.images.filter((img) => img.publicId !== publicId);
      const coverImage = prev.coverImage === publicId ? images[0]?.publicId || null : prev.coverImage;
      return { ...prev, images, coverImage };
    });
  };

  const setCoverImage = (publicId) => setForm((prev) => ({ ...prev, coverImage: publicId }));

  // Video upload — validated client-side for duration before it ever hits the network.
  // Never touches coverImage; video and images are fully separate fields.
  const handleVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      toast.error("Please select a video file");
      e.target.value = "";
      return;
    }

    // If already at the 4-image cap, adding a video would drop the cap to 3 —
    // ask the vendor to remove an image first instead of silently deleting one.
    if (form.images.length > MAX_IMAGES_WITH_VIDEO) {
      toast.error(
        `Remove at least one image first — only ${MAX_IMAGES_WITH_VIDEO} images are allowed alongside a video`
      );
      e.target.value = "";
      return;
    }

    try {
      const duration = await getVideoDuration(file);
      if (duration > MAX_VIDEO_SECONDS) {
        toast.error(`Video must be ${MAX_VIDEO_SECONDS} seconds or shorter (this one is ${Math.round(duration)}s)`);
        e.target.value = "";
        return;
      }
    } catch {
      toast.error("Could not read video file — try a different file");
      e.target.value = "";
      return;
    }

    setUploadingVideo(true);
    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const { data } = await axios.post("/api/upload", {
        fileBase64: base64,
        folder: "zorvik/products/videos",
        resourceType: "video",
      });
      if (data.success) {
        setForm((prev) => ({
          ...prev,
          video: { url: data.url, publicId: data.publicId },
        }));
        toast.success("Video uploaded");
      }
    } catch {
      toast.error("Video upload failed");
    } finally {
      setUploadingVideo(false);
      e.target.value = "";
    }
  };

  const removeVideo = () => setForm((prev) => ({ ...prev, video: null }));

  const addSize = (size) =>
    setForm((prev) => (prev.sizePool.includes(size) ? prev : { ...prev, sizePool: [...prev.sizePool, size] }));

  const removeSize = (size) =>
    setForm((prev) => ({ ...prev, sizePool: prev.sizePool.filter((s) => s !== size) }));

  const addColor = (hex) =>
    setForm((prev) =>
      prev.colorPool.some((c) => c.toLowerCase() === hex.toLowerCase())
        ? prev
        : { ...prev, colorPool: [...prev.colorPool, hex] }
    );

  const removeColor = (hex) =>
    setForm((prev) => ({ ...prev, colorPool: prev.colorPool.filter((c) => c.toLowerCase() !== hex.toLowerCase()) }));

  const handleCategoryChange = (id) => setForm((prev) => ({ ...prev, category: id }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.category) {
      toast.error("Please select a category");
      return;
    }
    if (form.images.length === 0) {
      toast.error("Add at least one product image");
      return;
    }
    if (form.images.length > maxImages) {
      toast.error(`Maximum ${maxImages} images allowed`);
      return;
    }
    setLoading(true);
    try {
      const orderedImages = [...form.images].sort((a, b) => {
        if (a.publicId === form.coverImage) return -1;
        if (b.publicId === form.coverImage) return 1;
        return 0;
      });
      const payload = { ...form, images: orderedImages };
      delete payload.coverImage;

      if (initialData) {
        await axios.put("/api/products", { productId: initialData._id, ...payload });
        toast.success("Product updated");
      } else {
        await axios.post("/api/products", payload);
        toast.success("Product created");
      }
      onSuccess?.();
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-2xl mx-auto bg-white text-[#1A1A1A]">
      <Section title="Basic Details">
        <div className="space-y-4">
          <div className="w-full">
            <label className="block text-sm font-medium mb-1.5 text-[#1A1A1A]">
              Product Name <span className="text-[#EC3237]">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="e.g. Classic Cotton T-Shirt"
              className="w-full px-4 py-2.5 rounded-lg border border-[#C7D8EA] bg-white text-[#1A1A1A] placeholder:text-[#5D8DC2] focus:outline-none focus:ring-2 focus:ring-[#316EB2]/30 focus:border-[#316EB2]"
            />
          </div>

          <div className="w-full">
            <label className="block text-sm font-medium mb-1.5 text-[#1A1A1A]">
              Description <span className="text-[#EC3237]">*</span>
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={4}
              required
              placeholder="Write a short product description..."
              className="w-full px-4 py-2.5 rounded-lg border border-[#C7D8EA] bg-white text-[#1A1A1A] placeholder:text-[#5D8DC2] focus:outline-none focus:ring-2 focus:ring-[#316EB2]/30 focus:border-[#316EB2]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="w-full">
              <label className="block text-sm font-medium mb-1.5 text-[#1A1A1A]">
                Price (Rs.) <span className="text-[#EC3237]">*</span>
              </label>
              <input
                type="number"
                name="price"
                value={form.price}
                onChange={handleChange}
                required
                placeholder="e.g. 1999"
                className="w-full px-4 py-2.5 rounded-lg border border-[#C7D8EA] bg-white text-[#1A1A1A] placeholder:text-[#5D8DC2] focus:outline-none focus:ring-2 focus:ring-[#316EB2]/30 focus:border-[#316EB2]"
              />
            </div>

            <div className="w-full">
              <label className="block text-sm font-medium mb-1.5 text-[#1A1A1A]">
                Category <span className="text-[#EC3237]">*</span>
              </label>
              <CategorySelect
                categories={categories}
                value={form.category}
                onChange={handleCategoryChange}
              />
            </div>
          </div>
        </div>
      </Section>

      {/* Sizes & Colors now comes right after Basic Details, before Images/Video */}
      <Section title="Sizes & Colors">
        <div className="space-y-5">
          <SizePoolBuilder pool={form.sizePool} onAdd={addSize} onRemove={removeSize} />
          <div className="h-px bg-[#C7D8EA]" />
          <ColorPoolBuilder pool={form.colorPool} onAdd={addColor} onRemove={removeColor} />
        </div>
      </Section>

      <Section
        title="Images"
        hint={
          form.video
            ? `Max ${maxImages} images (video attached), 1:1 recommended, click to set cover`
            : `Max ${maxImages} images, 1:1 size recommended, click a photo to set it as cover`
        }
      >
        <label
          className={`flex items-center justify-center gap-2 w-full py-4 rounded-xl border-2 border-dashed border-[#C7D8EA] text-sm cursor-pointer transition-colors hover:border-[#316EB2] hover:bg-[#C7D8EA]/10 ${
            uploading || form.images.length >= maxImages ? "opacity-60 pointer-events-none" : ""
          }`}
        >
          {uploading ? (
            <>
              <Loader2 size={16} className="animate-spin text-[#316EB2]" />
              <span className="text-[#5D8DC2]">Uploading...</span>
            </>
          ) : (
            <>
              <ImagePlus size={16} className="text-[#316EB2]" />
              <span className="text-[#5D8DC2]">
                Click to add photos (Max {maxImages})
              </span>
            </>
          )}
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
            disabled={form.images.length >= maxImages}
          />
        </label>

        {form.images.length > 0 && (
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 mt-4">
            {form.images.map((img) => {
              const isCover = img.publicId === form.coverImage;
              return (
                <div
                  key={img.publicId}
                  onClick={() => setCoverImage(img.publicId)}
                  className={`relative aspect-square rounded-xl overflow-hidden border-2 cursor-pointer group ${
                    isCover ? "border-[#316EB2]" : "border-[#C7D8EA]"
                  }`}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                  {isCover && (
                    <div className="absolute top-1.5 left-1.5 flex items-center gap-1 bg-[#EC3237] text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                      <Star size={10} fill="currentColor" />
                      Cover
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage(img.publicId);
                    }}
                    className="absolute top-1.5 right-1.5 bg-white border border-[#C7D8EA] shadow-sm rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={12} className="text-[#EC3237]" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      <Section
        title="Product Video (optional)"
        hint={`Max ${MAX_VIDEO_SECONDS}s, not used as cover image`}
      >
        {!form.video ? (
          <label
            className={`flex items-center justify-center gap-2 w-full py-4 rounded-xl border-2 border-dashed border-[#C7D8EA] text-sm cursor-pointer transition-colors hover:border-[#316EB2] hover:bg-[#C7D8EA]/10 ${
              uploadingVideo ? "opacity-60 pointer-events-none" : ""
            }`}
          >
            {uploadingVideo ? (
              <>
                <Loader2 size={16} className="animate-spin text-[#316EB2]" />
                <span className="text-[#5D8DC2]">Uploading video...</span>
              </>
            ) : (
              <>
                <Video size={16} className="text-[#316EB2]" />
                <span className="text-[#5D8DC2]">
                  Click to add a short video (max {MAX_VIDEO_SECONDS}s)
                </span>
              </>
            )}
            <input
              type="file"
              accept="video/*"
              onChange={handleVideoUpload}
              className="hidden"
            />
          </label>
        ) : (
          <div className="relative w-full max-w-[200px]">
            <div className="relative aspect-[9/16] rounded-xl overflow-hidden border-2 border-[#316EB2] bg-black">
              <video src={form.video.url} className="w-full h-full object-cover" muted />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <PlayCircle size={32} className="text-white/90" />
              </div>
            </div>
            <button
              type="button"
              onClick={removeVideo}
              className="absolute top-1.5 right-1.5 bg-white border border-[#C7D8EA] shadow-sm rounded-full p-1 hover:bg-[#EC3237]/10 transition-colors"
            >
              <X size={12} className="text-[#EC3237]" />
            </button>
          </div>
        )}
      </Section>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-xl bg-[#EC3237] hover:opacity-90 text-white font-semibold transition-colors disabled:opacity-60"
      >
        {loading ? "Saving..." : initialData ? "Update Product" : "Create Product"}
      </button>
    </form>
  );
}