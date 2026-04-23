import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./useAuth";
import { supabase } from "./supabase";
import MyOffersTab from "./MyOffersTab";
import MyQuestionsTab from "./MyQuestionsTab";
import MyOrdersTab from "./MyOrdersTab";

const SELLER_MENU = [
  { id: "profil", label: "Profil", icon: "👤" },
  { id: "inzeraty", label: "Moje inzeráty", icon: "📋" },
  { id: "pridat", label: "Přidat inzerát", icon: "➕" },
  { id: "prijmy", label: "Příjmy & statistiky", icon: "📊" },
  { id: "hodnoceni", label: "Hodnocení", icon: "⭐" },
  { id: "nabidky", label: "Moje nabídky", icon: "💰" },
  { id: "otazky", label: "Moje otázky", icon: "❓" },
  { id: "objednavky", label: "Moje objednávky", icon: "📦" },
  { id: "heslo", label: "Změna hesla", icon: "🔒" },
];

const KATEGORIE = ["Vybavení", "Krmivo & pamlsky", "Oblečení", "Hračky", "Přeprava", "Péče & hygiena"];
const ZVIRATA = ["Pes", "Kočka", "Hlodavec", "Ryba", "Pták", "Plaz", "Jiné"];
const STAVY = ["Nový", "Jako nový", "Dobrý", "Použitý"];
const MONTHS = ["Led", "Úno", "Bře", "Dub", "Kvě", "Čer", "Čec", "Srp", "Zář", "Říj", "Lis", "Pro"];

const COND_COLORS = {
  "nový": { bg: "#e3f2fd", color: "#0d47a1" }, "Nový": { bg: "#e3f2fd", color: "#0d47a1" },
  "jako nový": { bg: "#e8f5e9", color: "#1b5e20" }, "Jako nový": { bg: "#e8f5e9", color: "#1b5e20" },
  "dobrý": { bg: "#fff8e1", color: "#e65100" }, "Dobrý": { bg: "#fff8e1", color: "#e65100" },
  "použitý": { bg: "#fce4ec", color: "#880e4f" }, "Použitý": { bg: "#fce4ec", color: "#880e4f" },
};

function CondBadge({ cond }) {
  const s = COND_COLORS[cond] || { bg: "#f5f5f5", color: "#555" };
  return <span style={{ background: s.bg, color: s.color, fontSize: "0.68rem", fontWeight: 700, padding: "3px 9px", borderRadius: 20, textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{cond}</span>;
}

function InzeratDetail({ item, onClose, onUpdated, onDeleted }) {
  const { user } = useAuth();
  const [fotoIdx, setFotoIdx] = useState(0);
  const [editing, setEditing] = useState(false);
  const [showSleva, setShowSleva] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [slevaPercent, setSlevaPercent] = useState(item.discount_percent || "");
  const [form, setForm] = useState({
    title: item.title || "", price: item.price || "", city: item.city || "",
    description: item.description || "", category: item.category || "",
    animal: item.animal || "", condition: item.condition || "Dobrý",
  });
  const [existingFotos, setExistingFotos] = useState(item.foto_urls || []);
  const [newFotky, setNewFotky] = useState([]);
  const [newFotkyPreviews, setNewFotkyPreviews] = useState([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [msg, setMsg] = useState("");

  const fotos = item.foto_urls && item.foto_urls.length > 0 ? item.foto_urls : null;
  const discountedPrice = item.discount_percent ? Math.round(item.price * (1 - item.discount_percent / 100)) : null;
  const inputStyle = { width: "100%", border: "1.5px solid #ede8e0", borderRadius: 10, padding: "10px 14px", fontSize: "0.9rem", outline: "none", fontFamily: "'DM Sans', sans-serif", background: "#f7f4ef", boxSizing: "border-box", color: "#1c2b22" };
  const labelStyle = { fontSize: "0.72rem", fontWeight: 600, color: "#8a9e92", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 };

  const compressImage = (file) => new Promise((resolve) => {
    const canvas = document.createElement("canvas"); const img = new Image();
    img.onload = () => {
      const maxSize = 800; let w = img.width, h = img.height;
      if (w > h && w > maxSize) { h = (h * maxSize) / w; w = maxSize; } else if (h > maxSize) { w = (w * maxSize) / h; h = maxSize; }
      canvas.width = w; canvas.height = h; canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      canvas.toBlob((blob) => resolve(new File([blob], file.name, { type: "image/jpeg" })), "image/jpeg", 0.75);
    };
    img.src = URL.createObjectURL(file);
  });

  const handleNewFotky = async (e) => {
    const files = Array.from(e.target.files);
    if (existingFotos.length + newFotky.length + files.length > 5) { setMsg("⚠️ Max. 5 fotek celkem."); return; }
    const compressed = await Promise.all(files.map(compressImage));
    const updated = [...newFotky, ...compressed];
    setNewFotky(updated); setNewFotkyPreviews(updated.map(f => URL.createObjectURL(f)));
  };

  const removeExistingFoto = (idx) => { setExistingFotos(prev => prev.filter((_, i) => i !== idx)); if (fotoIdx >= existingFotos.length - 1) setFotoIdx(0); };
  const removeNewFoto = (idx) => { const nf = newFotky.filter((_, i) => i !== idx); setNewFotky(nf); setNewFotkyPreviews(nf.map(f => URL.createObjectURL(f))); };

  const handleSave = async () => {
    setSaving(true); setMsg("");
    try {
      const uploadedUrls = [];
      for (const fotka of newFotky) {
        const fileName = `${user.id}/${Date.now()}_${fotka.name}`;
        const { error: uploadError } = await supabase.storage.from("inzeraty").upload(fileName, fotka);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("inzeraty").getPublicUrl(fileName);
        uploadedUrls.push(urlData.publicUrl);
      }
      const { error } = await supabase.from("inzeraty").update({ title: form.title, price: parseInt(form.price), city: form.city, description: form.description, category: form.category, animal: form.animal, condition: form.condition, foto_urls: [...existingFotos, ...uploadedUrls] }).eq("id", item.id);
      if (error) throw error;
      setMsg("✅ Uloženo!"); setEditing(false); setNewFotky([]); setNewFotkyPreviews([]); onUpdated();
      setTimeout(() => setMsg(""), 2500);
    } catch (err) { setMsg("❌ Chyba: " + err.message); }
    setSaving(false);
  };

  const handleSleva = async () => {
    const pct = parseInt(slevaPercent);
    if (!pct || pct < 1 || pct > 90) { setMsg("⚠️ Zadej slevu 1–90 %."); return; }
    setSaving(true);
    await supabase.from("inzeraty").update({ discount_percent: pct }).eq("id", item.id);
    setSaving(false); setMsg(`✅ Sleva ${pct}% přidána!`); setShowSleva(false); onUpdated();
    setTimeout(() => setMsg(""), 2000);
  };

  const handleRemoveSleva = async () => {
    setSaving(true);
    await supabase.from("inzeraty").update({ discount_percent: null }).eq("id", item.id);
    setSaving(false); setMsg("✅ Sleva odebrána."); onUpdated();
    setTimeout(() => setMsg(""), 2000);
  };

  const handleDelete = async () => {
    setDeleting(true);
    const { error } = await supabase.from("inzeraty").delete().eq("id", item.id);
    setDeleting(false);
    if (error) { setMsg("❌ Chyba: " + error.message); setShowDeleteConfirm(false); return; }
    onDeleted(item.id); onClose();
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(28,43,34,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(5px)" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 22, maxWidth: 540, width: "100%", maxHeight: "92vh", overflowY: "auto", boxShadow: "0 12px 40px rgba(44,80,58,0.14)" }}>
        <div style={{ height: 280, background: "linear-gradient(145deg, #f2faf6, #f7f4ef)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", borderRadius: "22px 22px 0 0", overflow: "hidden" }}>
          {fotos ? <img src={fotos[fotoIdx]} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "contain" }} /> : <span style={{ fontSize: "5rem" }}>🐾</span>}
          {fotos && fotos.length > 1 && (
            <>
              <button onClick={e => { e.stopPropagation(); setFotoIdx(i => (i - 1 + fotos.length) % fotos.length); }} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.45)", border: "none", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", fontSize: "1.2rem", fontWeight: 700, color: "#fff" }}>‹</button>
              <button onClick={e => { e.stopPropagation(); setFotoIdx(i => (i + 1) % fotos.length); }} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.45)", border: "none", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", fontSize: "1.2rem", fontWeight: 700, color: "#fff" }}>›</button>
            </>
          )}
          {item.discount_percent && <div style={{ position: "absolute", top: 14, left: 14, background: "#e07b39", color: "#fff", borderRadius: 20, padding: "4px 12px", fontSize: "0.85rem", fontWeight: 700 }}>-{item.discount_percent}%</div>}
          <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, background: "rgba(255,255,255,0.9)", border: "none", borderRadius: "50%", width: 38, height: 38, cursor: "pointer", fontSize: "1.1rem", color: "#4a5e52", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>
        <div style={{ padding: "24px 26px 28px" }}>
          {!editing ? (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, gap: 12 }}>
                <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.25rem", color: "#1c2b22" }}>{item.title}</h2>
                <CondBadge cond={item.condition} />
              </div>
              <div style={{ marginBottom: 14 }}>
                {discountedPrice ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: "2rem", fontWeight: 700, color: "#2d6a4f", fontFamily: "'DM Serif Display', serif" }}>{discountedPrice} Kč</span>
                    <span style={{ fontSize: "1rem", color: "#8a9e92", textDecoration: "line-through" }}>{item.price} Kč</span>
                    <span style={{ background: "#fdf0e6", color: "#e07b39", borderRadius: 20, padding: "2px 10px", fontSize: "0.8rem", fontWeight: 700 }}>-{item.discount_percent}%</span>
                  </div>
                ) : <div style={{ fontSize: "2rem", fontWeight: 700, color: "#2d6a4f", fontFamily: "'DM Serif Display', serif" }}>{item.price} Kč</div>}
              </div>
              {item.description && <p style={{ color: "#4a5e52", fontSize: "0.92rem", lineHeight: 1.65, marginBottom: 18 }}>{item.description}</p>}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
                {[`📍 ${item.city}`, `🏷️ ${item.category || "—"}`, `🕐 ${item.created_at ? new Date(item.created_at).toLocaleDateString("cs-CZ") : ""}`, item.views > 0 ? `👁 ${item.views} zobrazení` : "👁 0 zobrazení"].map(tag => (
                  <span key={tag} style={{ background: tag.includes("👁") ? "#e8f5ef" : "#f7f4ef", border: `1px solid ${tag.includes("👁") ? "#b7d9c7" : "#ede8e0"}`, borderRadius: 20, padding: "5px 12px", fontSize: "0.78rem", color: tag.includes("👁") ? "#2d6a4f" : "#4a5e52", fontWeight: tag.includes("👁") ? 700 : 500 }}>{tag}</span>
                ))}
              </div>
              {msg && <div style={{ marginBottom: 12, fontSize: "0.85rem", color: msg.includes("❌") || msg.includes("⚠️") ? "#b91c1c" : "#166534" }}>{msg}</div>}
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
                <button onClick={() => { setEditing(true); setExistingFotos(item.foto_urls || []); setNewFotky([]); setNewFotkyPreviews([]); }} style={{ flex: 1, background: "#2d6a4f", color: "#fff", border: "none", borderRadius: 10, padding: "11px", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>✏️ Upravit</button>
                <button onClick={() => setShowSleva(!showSleva)} style={{ flex: 1, background: "#fff", color: "#e07b39", border: "2px solid #e07b39", borderRadius: 10, padding: "11px", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>🏷️ {item.discount_percent ? "Upravit slevu" : "Přidat slevu"}</button>
              </div>
              {item.discount_percent && <button onClick={handleRemoveSleva} disabled={saving} style={{ marginBottom: 10, width: "100%", background: "#fff", color: "#b91c1c", border: "1.5px solid #fecaca", borderRadius: 10, padding: "9px", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Odebrat slevu</button>}
              {showSleva && (
                <div style={{ marginBottom: 12, background: "#fdf0e6", borderRadius: 12, padding: "16px" }}>
                  <label style={labelStyle}>Sleva v % (1–90)</label>
                  <div style={{ display: "flex", gap: 10 }}>
                    <input type="number" min="1" max="90" value={slevaPercent} onChange={e => setSlevaPercent(e.target.value)} placeholder="Např. 20" style={{ ...inputStyle, flex: 1 }} />
                    <button onClick={handleSleva} disabled={saving} style={{ background: "#e07b39", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>{saving ? "..." : "Použít"}</button>
                  </div>
                  {slevaPercent && item.price && <div style={{ marginTop: 8, fontSize: "0.85rem", color: "#e07b39", fontWeight: 600 }}>Nová cena: {Math.round(item.price * (1 - parseInt(slevaPercent || 0) / 100))} Kč</div>}
                </div>
              )}
              {!showDeleteConfirm ? (
                <button onClick={() => setShowDeleteConfirm(true)} style={{ width: "100%", background: "#fff", color: "#b91c1c", border: "1.5px solid #fecaca", borderRadius: 10, padding: "10px", fontSize: "0.88rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>🗑️ Smazat inzerát</button>
              ) : (
                <div style={{ background: "#fce4ec", borderRadius: 12, padding: "16px", border: "1px solid #f48fb1" }}>
                  <div style={{ fontWeight: 600, color: "#b91c1c", marginBottom: 8, fontSize: "0.9rem" }}>⚠️ Opravdu chceš smazat tento inzerát?</div>
                  <div style={{ fontSize: "0.82rem", color: "#880e4f", marginBottom: 14 }}>Tato akce je nevratná.</div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={handleDelete} disabled={deleting} style={{ flex: 1, background: "#b91c1c", color: "#fff", border: "none", borderRadius: 10, padding: "10px", fontSize: "0.88rem", fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>{deleting ? "Mažu..." : "Ano, smazat"}</button>
                    <button onClick={() => setShowDeleteConfirm(false)} style={{ flex: 1, background: "#fff", color: "#4a5e52", border: "1.5px solid #ede8e0", borderRadius: 10, padding: "10px", fontSize: "0.88rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Zrušit</button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.2rem", color: "#1c2b22", marginBottom: 20 }}>Upravit inzerát</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={labelStyle}>Fotky ({existingFotos.length + newFotky.length}/5)</label>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
                    {existingFotos.map((src, i) => (
                      <div key={"ex-" + i} style={{ position: "relative", width: 80, height: 80 }}>
                        <img src={src} alt="" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 10, border: "2px solid #b7d9c7" }} />
                        <button onClick={() => removeExistingFoto(i)} style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%", background: "#b91c1c", color: "#fff", border: "none", cursor: "pointer", fontSize: "0.7rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                        <div style={{ position: "absolute", bottom: 2, left: 2, background: "rgba(45,106,79,0.85)", borderRadius: 4, padding: "1px 5px", fontSize: "0.55rem", color: "#fff", fontWeight: 700 }}>stávající</div>
                      </div>
                    ))}
                    {newFotkyPreviews.map((src, i) => (
                      <div key={"new-" + i} style={{ position: "relative", width: 80, height: 80 }}>
                        <img src={src} alt="" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 10, border: "2px solid #e07b39" }} />
                        <button onClick={() => removeNewFoto(i)} style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%", background: "#b91c1c", color: "#fff", border: "none", cursor: "pointer", fontSize: "0.7rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                        <div style={{ position: "absolute", bottom: 2, left: 2, background: "rgba(224,123,57,0.85)", borderRadius: 4, padding: "1px 5px", fontSize: "0.55rem", color: "#fff", fontWeight: 700 }}>nová</div>
                      </div>
                    ))}
                    {existingFotos.length + newFotky.length < 5 && (
                      <label style={{ width: 80, height: 80, borderRadius: 10, border: "2px dashed #b7d9c7", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#8a9e92", fontSize: "0.75rem", background: "#f7f4ef", gap: 4 }}>
                        <span style={{ fontSize: "1.5rem" }}>📷</span>Přidat
                        <input type="file" accept="image/*" multiple onChange={handleNewFotky} style={{ display: "none" }} />
                      </label>
                    )}
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "#8a9e92" }}>Zelený rámeček = stávající, oranžový = nové</div>
                </div>
                <div><label style={labelStyle}>Název *</label><input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} style={inputStyle} /></div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div><label style={labelStyle}>Cena (Kč) *</label><input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} style={inputStyle} /></div>
                  <div><label style={labelStyle}>Město *</label><input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} style={inputStyle} /></div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                  <div><label style={labelStyle}>Kategorie</label><select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={{ ...inputStyle, cursor: "pointer" }}>{KATEGORIE.map(k => <option key={k} value={k}>{k}</option>)}</select></div>
                  <div><label style={labelStyle}>Zvíře</label><select value={form.animal} onChange={e => setForm(f => ({ ...f, animal: e.target.value }))} style={{ ...inputStyle, cursor: "pointer" }}>{ZVIRATA.map(z => <option key={z} value={z}>{z}</option>)}</select></div>
                  <div><label style={labelStyle}>Stav</label><select value={form.condition} onChange={e => setForm(f => ({ ...f, condition: e.target.value }))} style={{ ...inputStyle, cursor: "pointer" }}>{STAVY.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                </div>
                <div><label style={labelStyle}>Popis</label><textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ ...inputStyle, minHeight: 100, resize: "vertical" }} /></div>
                {msg && <div style={{ fontSize: "0.85rem", color: msg.includes("❌") || msg.includes("⚠️") ? "#b91c1c" : "#166534" }}>{msg}</div>}
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={handleSave} disabled={saving} style={{ flex: 1, background: saving ? "#b5cec0" : "#2d6a4f", color: "#fff", border: "none", borderRadius: 10, padding: "12px", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>{saving ? "Ukládám..." : "💾 Uložit změny"}</button>
                  <button onClick={() => { setEditing(false); setMsg(""); }} style={{ background: "#fff", color: "#6b7280", border: "1.5px solid #ede8e0", borderRadius: 10, padding: "12px 20px", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Zrušit</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function MiniBarChart({ data }) {
  const max = Math.max(...data, 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 80, marginTop: 8 }}>
      {data.map((val, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <div style={{ width: "100%", background: val > 0 ? "#2d6a4f" : "#e8f5ef", borderRadius: "4px 4px 0 0", height: `${Math.max((val / max) * 64, val > 0 ? 4 : 0)}px` }} />
          <span style={{ fontSize: "0.6rem", color: "#8a9e92" }}>{MONTHS[i]}</span>
        </div>
      ))}
    </div>
  );
}

export default function ProfilePage() {
  const { user, profile, signOut, fetchProfile } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("profil");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: profile?.name || "", city: profile?.city || "", bio: profile?.bio || "" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [passwords, setPasswords] = useState({ new: "", confirm: "" });
  const [pwMsg, setPwMsg] = useState("");
  const [selectedInzerat, setSelectedInzerat] = useState(null);
  const [mojeInzeraty, setMojeInzeraty] = useState([]);
  const [pendingOffersCount, setPendingOffersCount] = useState(0);
  const [pendingQuestionsCount, setPendingQuestionsCount] = useState(0);
  const [inzeratForm, setInzeratForm] = useState({ title: "", price: "", city: "", desc: "", kategorie: "", zvire: "", stav: "Nový" });
  const [fotky, setFotky] = useState([]);
  const [fotkyPreviews, setFotkyPreviews] = useState([]);
  const [inzeratSaving, setInzeratSaving] = useState(false);
  const [inzeratMsg, setInzeratMsg] = useState("");

  const fetchMoje = async () => {
    if (!user) return;
    const { data } = await supabase.from("inzeraty").select("*").eq("seller_id", user.id).order("created_at", { ascending: false });
    if (data) setMojeInzeraty(data);
  };

  const fetchPendingCounts = async () => {
    if (!user) return;
    const { data: receivedOffers } = await supabase.from("offers").select("id").eq("seller_id", user.id).eq("status", "pending");
    const { data: sentOffers } = await supabase.from("offers").select("id").eq("buyer_id", user.id).in("status", ["countered", "accepted"]).is("order_id", null);
    setPendingOffersCount((receivedOffers?.length || 0) + (sentOffers?.length || 0));

    const { data: receivedQuestions } = await supabase.from("questions").select("id").eq("seller_id", user.id).is("answer", null);
    setPendingQuestionsCount(receivedQuestions?.length || 0);
  };

  useEffect(() => {
    fetchMoje();
    fetchPendingCounts();

    if (!user) return;
    const channel = supabase
      .channel(`profile-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "offers" }, () => fetchPendingCounts())
      .on("postgres_changes", { event: "*", schema: "public", table: "questions" }, () => fetchPendingCounts())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [user]);

  const mockPrijmy = [0, 0, 145, 0, 340, 115, 0, 0, 0, 0, 0, 0];
  const mockHodnoceni = [
    { id: 1, from: "Jana K.", rating: 5, text: "Rychlé jednání, zboží přesně jak popsáno!", date: "15. 3. 2026" },
    { id: 2, from: "Tomáš M.", rating: 4, text: "Spokojený, doporučuji.", date: "2. 4. 2026" },
  ];

  const handleSaveProfile = async () => {
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ name: form.name, city: form.city, bio: form.bio }).eq("id", user.id);
    setSaving(false);
    if (error) { setMsg("Chyba."); return; }
    await fetchProfile(user.id); setMsg("✅ Uloženo!"); setEditing(false);
    setTimeout(() => setMsg(""), 3000);
  };

  const handlePasswordChange = async () => {
    if (passwords.new !== passwords.confirm) { setPwMsg("Hesla se neshodují."); return; }
    if (passwords.new.length < 6) { setPwMsg("Min. 6 znaků."); return; }
    const { error } = await supabase.auth.updateUser({ password: passwords.new });
    if (error) { setPwMsg("Chyba: " + error.message); return; }
    setPwMsg("✅ Heslo změněno!"); setPasswords({ new: "", confirm: "" });
    setTimeout(() => setPwMsg(""), 3000);
  };

  const handleSignOut = async () => { await signOut(); navigate("/"); };

  const compressImage = (file) => new Promise((resolve) => {
    const canvas = document.createElement("canvas"); const img = new Image();
    img.onload = () => {
      const maxSize = 800; let w = img.width, h = img.height;
      if (w > h && w > maxSize) { h = (h * maxSize) / w; w = maxSize; } else if (h > maxSize) { w = (w * maxSize) / h; h = maxSize; }
      canvas.width = w; canvas.height = h; canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      canvas.toBlob((blob) => resolve(new File([blob], file.name, { type: "image/jpeg" })), "image/jpeg", 0.75);
    };
    img.src = URL.createObjectURL(file);
  });

  const handleFotkyChange = async (e) => {
    const files = Array.from(e.target.files);
    if (fotky.length + files.length > 5) { setInzeratMsg("⚠️ Max. 5 fotek."); return; }
    const compressed = await Promise.all(files.map(compressImage));
    const newFotky = [...fotky, ...compressed].slice(0, 5);
    setFotky(newFotky); setFotkyPreviews(newFotky.map(f => URL.createObjectURL(f)));
  };

  const removeFotka = (idx) => {
    const nf = fotky.filter((_, i) => i !== idx); const np = fotkyPreviews.filter((_, i) => i !== idx);
    setFotky(nf); setFotkyPreviews(np);
  };

  const handleInzeratSubmit = async () => {
    if (!inzeratForm.title || !inzeratForm.price || !inzeratForm.city || !inzeratForm.kategorie || !inzeratForm.zvire) { setInzeratMsg("⚠️ Vyplň všechna povinná pole."); return; }
    setInzeratSaving(true); setInzeratMsg("");
    try {
      const fotoUrls = [];
      for (const fotka of fotky) {
        const fileName = `${user.id}/${Date.now()}_${fotka.name}`;
        const { error: uploadError } = await supabase.storage.from("inzeraty").upload(fileName, fotka);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("inzeraty").getPublicUrl(fileName);
        fotoUrls.push(urlData.publicUrl);
      }
      const { error: dbError } = await supabase.from("inzeraty").insert({ title: inzeratForm.title, price: parseInt(inzeratForm.price), city: inzeratForm.city, description: inzeratForm.desc, category: inzeratForm.kategorie, animal: inzeratForm.zvire, condition: inzeratForm.stav, foto_urls: fotoUrls, seller_id: user.id, seller_name: profile?.name || user.email });
      if (dbError) throw dbError;
      setInzeratMsg("🎉 Inzerát zveřejněn!");
      setInzeratForm({ title: "", price: "", city: "", desc: "", kategorie: "", zvire: "", stav: "Nový" });
      setFotky([]); setFotkyPreviews([]);
      await fetchMoje();
      setTimeout(() => { setInzeratMsg(""); setActiveTab("inzeraty"); }, 2000);
    } catch (err) { setInzeratMsg("❌ Chyba: " + err.message); }
    setInzeratSaving(false);
  };

  const handleInzeratDeleted = (deletedId) => { setMojeInzeraty(prev => prev.filter(i => i.id !== deletedId)); };

  const roleLabel = { buyer: "🛒 Kupující", seller: "🏪 Prodejce", vet: "🩺 Veterinář" };
  const role = profile?.role || "buyer";
  if (!user) { navigate("/"); return null; }

  const inputStyle = { width: "100%", border: "1.5px solid #ede8e0", borderRadius: 10, padding: "10px 14px", fontSize: "0.95rem", outline: "none", fontFamily: "'DM Sans', sans-serif", background: "#f7f4ef", boxSizing: "border-box", color: "#1c2b22" };
  const labelStyle = { fontSize: "0.72rem", fontWeight: 600, color: "#8a9e92", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 };

  const getBadgeCount = (id) => {
    if (id === "nabidky") return pendingOffersCount;
    if (id === "otazky") return pendingQuestionsCount;
    return 0;
  };

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600;700&display=swap');`}</style>
      <nav style={{ background: "#fff", borderBottom: "1px solid #ede8e0", height: 64, display: "flex", alignItems: "center", padding: "0 32px", gap: 16, position: "sticky", top: 0, zIndex: 100, boxShadow: "0 1px 12px rgba(44,80,58,0.07)" }}>
        <button onClick={() => navigate("/")} style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer" }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: "#2d6a4f", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>🐾</div>
          <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.15rem", color: "#1c2b22" }}>Pet Market</span>
        </button>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: "0.85rem", color: "#4a5e52" }}>{user?.email}</span>
          <button onClick={handleSignOut} style={{ background: "#fff", color: "#b91c1c", border: "1.5px solid #fecaca", borderRadius: 8, padding: "7px 14px", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Odhlásit</button>
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px", display: "flex", gap: 28 }}>
        <div style={{ width: 260, flexShrink: 0 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: "24px 20px", marginBottom: 12, border: "1px solid #ede8e0", textAlign: "center" }}>
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#2d6a4f", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.8rem", margin: "0 auto 12px" }}>🐾</div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.15rem", color: "#1c2b22", marginBottom: 6 }}>{profile?.name || user?.email?.split("@")[0]}</div>
            <span style={{ background: "#e8f5ef", color: "#2d6a4f", border: "1px solid #b7d9c7", borderRadius: 20, padding: "3px 12px", fontSize: "0.78rem", fontWeight: 600 }}>{roleLabel[role] || "🐾 Uživatel"}</span>
          </div>
          <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden", border: "1px solid #ede8e0" }}>
            {SELLER_MENU.map((item, i) => {
              const badgeCount = getBadgeCount(item.id);
              return (
                <button key={item.id} onClick={() => setActiveTab(item.id)} style={{ width: "100%", padding: "13px 20px", display: "flex", alignItems: "center", gap: 12, background: activeTab === item.id ? "#e8f5ef" : "#fff", border: "none", borderBottom: i < SELLER_MENU.length - 1 ? "1px solid #f7f4ef" : "none", cursor: "pointer", fontSize: "0.88rem", fontWeight: activeTab === item.id ? 600 : 400, color: activeTab === item.id ? "#2d6a4f" : "#4a5e52", fontFamily: "'DM Sans', sans-serif", textAlign: "left" }}>
                  <span>{item.icon}</span>{item.label}
                  {badgeCount > 0 && <span style={{ marginLeft: "auto", background: "#e07b39", color: "#fff", borderRadius: 20, padding: "1px 8px", fontSize: "0.72rem", fontWeight: 700 }}>{badgeCount}</span>}
                  {activeTab === item.id && badgeCount === 0 && <span style={{ marginLeft: "auto", color: "#2d6a4f" }}>›</span>}
                </button>
              );
            })}
            <button onClick={handleSignOut} style={{ width: "100%", padding: "13px 20px", display: "flex", alignItems: "center", gap: 12, background: "#fff", border: "none", borderTop: "1px solid #f7f4ef", cursor: "pointer", fontSize: "0.88rem", color: "#b91c1c", fontFamily: "'DM Sans', sans-serif", textAlign: "left" }}>
              <span>🚪</span> Odhlásit se
            </button>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          {activeTab === "profil" && (
            <div style={{ background: "#fff", borderRadius: 16, padding: "28px 32px", border: "1px solid #ede8e0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.4rem", color: "#1c2b22", margin: 0 }}>Můj profil</h2>
                {!editing && <button onClick={() => setEditing(true)} style={{ background: "#2d6a4f", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>✏️ Upravit</button>}
              </div>
              {!editing ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {[{ label: "Celé jméno", value: profile?.name || "—" }, { label: "E-mail", value: user?.email }, { label: "Město", value: profile?.city || "—" }, { label: "O mně", value: profile?.bio || "—" }].map(({ label, value }) => (
                    <div key={label} style={{ borderBottom: "1px solid #f7f4ef", paddingBottom: 16 }}>
                      <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "#8a9e92", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{label}</div>
                      <div style={{ color: "#1c2b22", fontSize: "0.95rem" }}>{value}</div>
                    </div>
                  ))}
                  {msg && <div style={{ color: "#166534", fontSize: "0.85rem" }}>{msg}</div>}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {[{ label: "Celé jméno", key: "name", placeholder: "Jana Nováková" }, { label: "Město", key: "city", placeholder: "Praha" }].map(({ label, key, placeholder }) => (
                    <div key={key}><label style={labelStyle}>{label}</label><input value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder} style={inputStyle} /></div>
                  ))}
                  <div><label style={labelStyle}>O mně</label><textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} placeholder="Něco o sobě..." style={{ ...inputStyle, minHeight: 100, resize: "vertical" }} /></div>
                  {msg && <div style={{ color: msg.includes("Chyba") ? "#b91c1c" : "#166534", fontSize: "0.85rem" }}>{msg}</div>}
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={handleSaveProfile} disabled={saving} style={{ flex: 1, background: saving ? "#b5cec0" : "#2d6a4f", color: "#fff", border: "none", borderRadius: 10, padding: "12px", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>{saving ? "Ukládám..." : "💾 Uložit"}</button>
                    <button onClick={() => setEditing(false)} style={{ background: "#fff", color: "#6b7280", border: "1.5px solid #ede8e0", borderRadius: 10, padding: "12px 20px", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Zrušit</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "inzeraty" && (
            <div style={{ background: "#fff", borderRadius: 16, padding: "28px 32px", border: "1px solid #ede8e0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.4rem", color: "#1c2b22", margin: 0 }}>Moje inzeráty</h2>
                <button onClick={() => setActiveTab("pridat")} style={{ background: "#2d6a4f", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>+ Přidat</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {mojeInzeraty.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px", color: "#8a9e92" }}><div style={{ fontSize: "2rem", marginBottom: 12 }}>📋</div><p>Zatím žádné inzeráty.</p></div>
                ) : mojeInzeraty.map(item => {
                  const discounted = item.discount_percent ? Math.round(item.price * (1 - item.discount_percent / 100)) : null;
                  return (
                    <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px", border: "1px solid #ede8e0", borderRadius: 12, cursor: "pointer", transition: "background 0.15s" }}
                      onClick={() => setSelectedInzerat(item)}
                      onMouseOver={e => e.currentTarget.style.background = "#f7f4ef"}
                      onMouseOut={e => e.currentTarget.style.background = "#fff"}>
                      <div style={{ width: 56, height: 56, borderRadius: 10, background: "#e8f5ef", overflow: "hidden", flexShrink: 0, position: "relative" }}>
                        {item.foto_urls?.[0] ? <img src={item.foto_urls[0]} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>🐾</div>}
                        {item.discount_percent && <div style={{ position: "absolute", top: 2, left: 2, background: "#e07b39", color: "#fff", borderRadius: 6, padding: "1px 5px", fontSize: "0.6rem", fontWeight: 700 }}>-{item.discount_percent}%</div>}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, color: "#1c2b22", marginBottom: 4 }}>{item.title}</div>
                        <div style={{ fontSize: "0.78rem", color: "#8a9e92", display: "flex", gap: 10, flexWrap: "wrap" }}>
                          <span>📍 {item.city}</span>
                          <span>🕐 {item.created_at ? new Date(item.created_at).toLocaleDateString("cs-CZ") : ""}</span>
                          <span style={{ color: "#2d6a4f", fontWeight: 600 }}>👁 {item.views || 0} zobrazení</span>
                        </div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        {discounted ? (<><div style={{ fontWeight: 700, color: "#2d6a4f", fontSize: "1.1rem" }}>{discounted} Kč</div><div style={{ fontSize: "0.78rem", color: "#8a9e92", textDecoration: "line-through" }}>{item.price} Kč</div></>) : <div style={{ fontWeight: 700, color: "#2d6a4f", fontSize: "1.1rem" }}>{item.price} Kč</div>}
                        <CondBadge cond={item.condition} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === "pridat" && (
            <div style={{ background: "#fff", borderRadius: 16, padding: "28px 32px", border: "1px solid #ede8e0" }}>
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.4rem", color: "#1c2b22", marginBottom: 24 }}>Přidat inzerát</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div>
                  <label style={labelStyle}>Fotky (max. 5) *</label>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
                    {fotkyPreviews.map((src, i) => (
                      <div key={i} style={{ position: "relative", width: 90, height: 90 }}>
                        <img src={src} alt="" style={{ width: 90, height: 90, objectFit: "cover", borderRadius: 10, border: "1.5px solid #ede8e0" }} />
                        <button onClick={() => removeFotka(i)} style={{ position: "absolute", top: -6, right: -6, width: 22, height: 22, borderRadius: "50%", background: "#b91c1c", color: "#fff", border: "none", cursor: "pointer", fontSize: "0.7rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                      </div>
                    ))}
                    {fotky.length < 5 && (
                      <label style={{ width: 90, height: 90, borderRadius: 10, border: "2px dashed #b7d9c7", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#8a9e92", fontSize: "0.75rem", background: "#f7f4ef", gap: 4 }}>
                        <span style={{ fontSize: "1.5rem" }}>📷</span>Přidat
                        <input type="file" accept="image/*" multiple onChange={handleFotkyChange} style={{ display: "none" }} />
                      </label>
                    )}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#8a9e92" }}>JPG, PNG, WEBP · Max. 5 MB na fotku</div>
                </div>
                <div><label style={labelStyle}>Název inzerátu *</label><input value={inzeratForm.title} onChange={e => setInzeratForm(f => ({ ...f, title: e.target.value }))} placeholder="Pelíšek pro psa, vel. M" style={inputStyle} /></div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div><label style={labelStyle}>Kategorie *</label><select value={inzeratForm.kategorie} onChange={e => setInzeratForm(f => ({ ...f, kategorie: e.target.value }))} style={{ ...inputStyle, cursor: "pointer" }}><option value="">Vybrat...</option>{KATEGORIE.map(k => <option key={k} value={k}>{k}</option>)}</select></div>
                  <div><label style={labelStyle}>Zvíře *</label><select value={inzeratForm.zvire} onChange={e => setInzeratForm(f => ({ ...f, zvire: e.target.value }))} style={{ ...inputStyle, cursor: "pointer" }}><option value="">Vybrat...</option>{ZVIRATA.map(z => <option key={z} value={z}>{z}</option>)}</select></div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                  <div><label style={labelStyle}>Cena (Kč) *</label><input type="number" value={inzeratForm.price} onChange={e => setInzeratForm(f => ({ ...f, price: e.target.value }))} placeholder="350" style={inputStyle} /></div>
                  <div><label style={labelStyle}>Stav *</label><select value={inzeratForm.stav} onChange={e => setInzeratForm(f => ({ ...f, stav: e.target.value }))} style={{ ...inputStyle, cursor: "pointer" }}>{STAVY.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                  <div><label style={labelStyle}>Město *</label><input value={inzeratForm.city} onChange={e => setInzeratForm(f => ({ ...f, city: e.target.value }))} placeholder="Praha" style={inputStyle} /></div>
                </div>
                <div><label style={labelStyle}>Popis</label><textarea value={inzeratForm.desc} onChange={e => setInzeratForm(f => ({ ...f, desc: e.target.value }))} placeholder="Stav, rozměry, důvod prodeje..." style={{ ...inputStyle, minHeight: 120, resize: "vertical" }} /></div>
                {inzeratMsg && <div style={{ background: inzeratMsg.includes("❌") || inzeratMsg.includes("⚠️") ? "#fce4ec" : "#e8f5e9", border: `1px solid ${inzeratMsg.includes("❌") || inzeratMsg.includes("⚠️") ? "#f48fb1" : "#a5d6a7"}`, borderRadius: 10, padding: "10px 14px", fontSize: "0.85rem", color: inzeratMsg.includes("❌") || inzeratMsg.includes("⚠️") ? "#880e4f" : "#1b5e20" }}>{inzeratMsg}</div>}
                <button onClick={handleInzeratSubmit} disabled={inzeratSaving} style={{ background: inzeratSaving ? "#b5cec0" : "#2d6a4f", color: "#fff", border: "none", borderRadius: 10, padding: "14px", fontSize: "1rem", fontWeight: 600, cursor: inzeratSaving ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif", boxShadow: "0 2px 12px rgba(45,106,79,0.25)" }}>{inzeratSaving ? "Zveřejňuji..." : "✓ Zveřejnit inzerát"}</button>
              </div>
            </div>
          )}

          {activeTab === "prijmy" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                {[{ label: "Celková hodnota", value: `${mojeInzeraty.reduce((s, i) => s + i.price, 0)} Kč`, icon: "💰" }, { label: "Moje inzeráty", value: mojeInzeraty.length, icon: "📋" }, { label: "Celkem zobrazení", value: mojeInzeraty.reduce((s, i) => s + (i.views || 0), 0), icon: "👁" }].map(({ label, value, icon }) => (
                  <div key={label} style={{ background: "#fff", borderRadius: 14, padding: "20px", border: "1px solid #ede8e0", textAlign: "center" }}>
                    <div style={{ fontSize: "1.8rem", marginBottom: 8 }}>{icon}</div>
                    <div style={{ fontSize: "1.3rem", fontWeight: 700, color: "#2d6a4f", fontFamily: "'DM Serif Display', serif" }}>{value}</div>
                    <div style={{ fontSize: "0.78rem", color: "#8a9e92", marginTop: 4 }}>{label}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: "#fff", borderRadius: 16, padding: "28px 32px", border: "1px solid #ede8e0" }}>
                <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.3rem", color: "#1c2b22", marginBottom: 4 }}>Příjmy podle měsíce</h2>
                <div style={{ fontSize: "0.85rem", color: "#8a9e92", marginBottom: 16 }}>Rok 2026</div>
                <MiniBarChart data={mockPrijmy} />
              </div>
              {mojeInzeraty.length > 0 && (
                <div style={{ background: "#fff", borderRadius: 16, padding: "28px 32px", border: "1px solid #ede8e0" }}>
                  <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.3rem", color: "#1c2b22", marginBottom: 16 }}>Zobrazení podle inzerátu</h2>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {[...mojeInzeraty].sort((a, b) => (b.views || 0) - (a.views || 0)).map(item => (
                      <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", border: "1px solid #ede8e0", borderRadius: 10 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 8, background: "#e8f5ef", overflow: "hidden", flexShrink: 0 }}>
                          {item.foto_urls?.[0] ? <img src={item.foto_urls[0]} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem" }}>🐾</div>}
                        </div>
                        <div style={{ flex: 1, fontSize: "0.88rem", color: "#1c2b22", fontWeight: 500 }}>{item.title}</div>
                        <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#2d6a4f" }}>👁 {item.views || 0}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "hodnoceni" && (
            <div style={{ background: "#fff", borderRadius: 16, padding: "28px 32px", border: "1px solid #ede8e0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
                <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.4rem", color: "#1c2b22", margin: 0 }}>Hodnocení</h2>
                <div style={{ background: "#e8f5ef", color: "#2d6a4f", borderRadius: 20, padding: "4px 14px", fontSize: "0.9rem", fontWeight: 700 }}>⭐ 4.8 / 5</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {mockHodnoceni.map(h => (
                  <div key={h.id} style={{ padding: "16px", border: "1px solid #ede8e0", borderRadius: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <div style={{ fontWeight: 600, color: "#1c2b22" }}>{h.from}</div>
                      <div style={{ fontSize: "0.8rem", color: "#8a9e92" }}>{h.date}</div>
                    </div>
                    <div style={{ marginBottom: 8 }}>{"⭐".repeat(h.rating)}</div>
                    <div style={{ color: "#4a5e52", fontSize: "0.9rem" }}>{h.text}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "nabidky" && <MyOffersTab user={user} profile={profile} />}

          {activeTab === "otazky" && <MyQuestionsTab user={user} profile={profile} />}

          {activeTab === "objednavky" && <MyOrdersTab user={user} />}

          {activeTab === "heslo" && (
            <div style={{ background: "#fff", borderRadius: 16, padding: "28px 32px", border: "1px solid #ede8e0" }}>
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.4rem", color: "#1c2b22", marginBottom: 24 }}>Změna hesla</h2>
              <div style={{ maxWidth: 400, display: "flex", flexDirection: "column", gap: 16 }}>
                {[{ label: "Nové heslo", key: "new", placeholder: "Min. 6 znaků" }, { label: "Potvrdit heslo", key: "confirm", placeholder: "Zopakuj heslo" }].map(({ label, key, placeholder }) => (
                  <div key={key}><label style={labelStyle}>{label}</label><input type="password" value={passwords[key]} onChange={e => setPasswords(p => ({ ...p, [key]: e.target.value }))} placeholder={placeholder} style={inputStyle} /></div>
                ))}
                {pwMsg && <div style={{ color: pwMsg.includes("✅") ? "#166534" : "#b91c1c", fontSize: "0.85rem" }}>{pwMsg}</div>}
                <button onClick={handlePasswordChange} style={{ background: "#2d6a4f", color: "#fff", border: "none", borderRadius: 10, padding: "12px", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>🔒 Změnit heslo</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedInzerat && (
        <InzeratDetail item={selectedInzerat} onClose={() => setSelectedInzerat(null)} onDeleted={handleInzeratDeleted}
          onUpdated={async () => {
            await fetchMoje();
            const { data } = await supabase.from("inzeraty").select("*").eq("id", selectedInzerat.id).single();
            if (data) setSelectedInzerat(data);
          }} />
      )}
    </div>
  );
}