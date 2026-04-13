import { useState } from "react";
import { supabase } from "./supabase";
import { useAuth } from "./useAuth";

export default function ProductAdd({ onClose, onSaved }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    animal: "",
    stock: 1,
  });
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const categories = ["Krmivo", "Hračky", "Obojky a vodítka", "Pelíšky", "Hygiena", "Doplňky", "Jiné"];
  const animals = ["Pes", "Kočka", "Hlodavec", "Pták", "Ryba", "Plaz", "Jiné"];

  async function compressImage(file) {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const img = new Image();
      img.onload = () => {
        const max = 800;
        let w = img.width, h = img.height;
        if (w > max) { h = (h * max) / w; w = max; }
        if (h > max) { w = (w * max) / h; h = max; }
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.75);
      };
      img.src = URL.createObjectURL(file);
    });
  }

  async function handlePhotos(e) {
    const files = Array.from(e.target.files).slice(0, 5);
    setPhotos(files);
  }

  async function handleSubmit() {
    if (!form.title || !form.price || !form.category) {
      setError("Vyplň název, cenu a kategorii.");
      return;
    }
    setUploading(true);
    setError("");

    try {
      // Upload fotek
      const urls = [];
      for (const file of photos) {
        const compressed = await compressImage(file);
        const path = `${user.id}/${Date.now()}-${file.name}`;
        const { error: upErr } = await supabase.storage
          .from("products")
          .upload(path, compressed, { contentType: "image/jpeg" });
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage.from("products").getPublicUrl(path);
        urls.push(urlData.publicUrl);
      }

      // Získání jména prodejce
      const { data: profile } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", user.id)
        .single();

      // Uložení produktu
      const { error: insertErr } = await supabase.from("products").insert({
        seller_id: user.id,
        seller_name: profile?.name || user.email,
        title: form.title,
        description: form.description,
        price: parseFloat(form.price),
        category: form.category,
        animal: form.animal,
        stock: parseInt(form.stock),
        foto_urls: urls,
      });

      if (insertErr) throw insertErr;

      onSaved?.();
      onClose?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Přidat produkt</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Název produktu *</label>
            <input
              className="w-full border rounded-lg px-3 py-2"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="např. Granule pro psy 5kg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Popis</label>
            <textarea
              className="w-full border rounded-lg px-3 py-2 h-24"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Popis produktu..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Cena (Kč) *</label>
              <input
                type="number"
                className="w-full border rounded-lg px-3 py-2"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Skladem (ks)</label>
              <input
                type="number"
                className="w-full border rounded-lg px-3 py-2"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                min="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Kategorie *</label>
              <select
                className="w-full border rounded-lg px-3 py-2"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                <option value="">Vyber...</option>
                {categories.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Zvíře</label>
              <select
                className="w-full border rounded-lg px-3 py-2"
                value={form.animal}
                onChange={(e) => setForm({ ...form, animal: e.target.value })}
              >
                <option value="">Vyber...</option>
                {animals.map((a) => <option key={a}>{a}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Fotky (max 5)</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotos}
              className="w-full border rounded-lg px-3 py-2"
            />
            {photos.length > 0 && (
              <p className="text-sm text-gray-500 mt-1">{photos.length} fotka/fotek vybrána</p>
            )}
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={uploading}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl disabled:opacity-50"
          >
            {uploading ? "Ukládám..." : "Přidat produkt"}
          </button>
        </div>
      </div>
    </div>
  );
}