import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./useAuth";
import { supabase } from "./supabase";

const SELLER_MENU = [
  { id: "profil", label: "Profil", icon: "👤" },
  { id: "inzeraty", label: "Moje inzeráty", icon: "📋" },
  { id: "pridat", label: "Přidat inzerát", icon: "➕" },
  { id: "prijmy", label: "Příjmy & statistiky", icon: "📊" },
  { id: "hodnoceni", label: "Hodnocení", icon: "⭐" },
  { id: "zpravy", label: "Zprávy", icon: "💬" },
  { id: "heslo", label: "Změna hesla", icon: "🔒" },
];

const KATEGORIE = ["Vybavení", "Krmivo & pamlsky", "Oblečení", "Hračky", "Přeprava", "Péče & hygiena"];
const ZVIRATA = ["Pes", "Kočka", "Hlodavec", "Ryba", "Pták", "Plaz", "Jiné"];
const STAVY = ["Nový", "Jako nový", "Dobrý", "Použitý"];
const MONTHS = ["Led", "Úno", "Bře", "Dub", "Kvě", "Čer", "Čec", "Srp", "Zář", "Říj", "Lis", "Pro"];

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

  const role = profile?.role || "buyer";
  const MENU = SELLER_MENU;

  const [activeTab, setActiveTab] = useState("profil");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: profile?.name || "", city: profile?.city || "", bio: profile?.bio || "" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [passwords, setPasswords] = useState({ new: "", confirm: "" });
  const [pwMsg, setPwMsg] = useState("");

  // Formulář pro přidání inzerátu
  const [inzeratForm, setInzeratForm] = useState({
    title: "", price: "", city: "", desc: "",
    kategorie: "", zvire: "", stav: "Nový",
  });
  const [fotky, setFotky] = useState([]); // pole File objektů
  const [fotkyPreviews, setFotkyPreviews] = useState([]); // preview URL
  const [inzeratSaving, setInzeratSaving] = useState(false);
  const [inzeratMsg, setInzeratMsg] = useState("");
const [mojeInzeraty, setMojeInzeraty] = useState([]);

useEffect(() => {
  if (!user) return;
  const fetchMoje = async () => {
    const { data, error } = await supabase
      .from("inzeraty")
      .select("*")
      .eq("seller_id", user.id)
      .order("created_at", { ascending: false });
    if (!error && data) setMojeInzeraty(data);
  };
  fetchMoje();
}, [user]);
  const mockInzeraty = [
    { id: 1, title: "Pelíšek M/L", price: 340, status: "aktivní", views: 45, emoji: "🛏️" },
    { id: 2, title: "Vodítko kožené", price: 115, status: "aktivní", views: 23, emoji: "🔗" },
    { id: 3, title: "Zimní bundička", price: 145, status: "prodáno", views: 89, emoji: "🧥" },
  ];
  const mockPrijmy = [0, 0, 145, 0, 340, 115, 0, 0, 0, 0, 0, 0];
  const mockHodnoceni = [
    { id: 1, from: "Jana K.", rating: 5, text: "Rychlé jednání, zboží přesně jak popsáno!", date: "15. 3. 2026" },
    { id: 2, from: "Tomáš M.", rating: 4, text: "Spokojený, doporučuji.", date: "2. 4. 2026" },
  ];

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ name: form.name, city: form.city, bio: form.bio }).eq("id", user.id);
    setSaving(false);
    if (error) { setMsg("Chyba při ukládání."); return; }
    await fetchProfile(user.id);
    setMsg("✅ Uloženo!");
    setEditing(false);
    setTimeout(() => setMsg(""), 3000);
  };

  const handlePasswordChange = async () => {
    if (passwords.new !== passwords.confirm) { setPwMsg("Hesla se neshodují."); return; }
    if (passwords.new.length < 6) { setPwMsg("Heslo musí mít alespoň 6 znaků."); return; }
    const { error } = await supabase.auth.updateUser({ password: passwords.new });
    if (error) { setPwMsg("Chyba: " + error.message); return; }
    setPwMsg("✅ Heslo změněno!");
    setPasswords({ new: "", confirm: "" });
    setTimeout(() => setPwMsg(""), 3000);
  };

  const handleSignOut = async () => { await signOut(); navigate("/"); };

  // Nahrání fotek
  const compressImage = (file) => {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const img = new Image();
    img.onload = () => {
      const maxSize = 800;
      let w = img.width, h = img.height;
      if (w > h && w > maxSize) { h = (h * maxSize) / w; w = maxSize; }
      else if (h > maxSize) { w = (w * maxSize) / h; h = maxSize; }
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      canvas.toBlob((blob) => resolve(new File([blob], file.name, { type: "image/jpeg" })), "image/jpeg", 0.75);
    };
    img.src = URL.createObjectURL(file);
  });
};

const handleFotkyChange = async (e) => {
  const files = Array.from(e.target.files);
  if (fotky.length + files.length > 5) {
    setInzeratMsg("⚠️ Maximálně 5 fotek.");
    return;
  }
  const compressed = await Promise.all(files.map(compressImage));
  const newFotky = [...fotky, ...compressed].slice(0, 5);
  setFotky(newFotky);
  setFotkyPreviews(newFotky.map(f => URL.createObjectURL(f)));
};


  const removeFotka = (idx) => {
    const newFotky = fotky.filter((_, i) => i !== idx);
    const newPreviews = fotkyPreviews.filter((_, i) => i !== idx);
    setFotky(newFotky);
    setFotkyPreviews(newPreviews);
  };

  // Publikování inzerátu
  const handleInzeratSubmit = async () => {
    if (!inzeratForm.title || !inzeratForm.price || !inzeratForm.city || !inzeratForm.kategorie || !inzeratForm.zvire) {
      setInzeratMsg("⚠️ Vyplň všechna povinná pole.");
      return;
    }
    setInzeratSaving(true);
    setInzeratMsg("");

    try {
      // Nahrát fotky do Supabase Storage
      const fotoUrls = [];
      for (const fotka of fotky) {
        const fileName = `${user.id}/${Date.now()}_${fotka.name}`;
        const { error: uploadError } = await supabase.storage
          .from("inzeraty")
          .upload(fileName, fotka);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("inzeraty").getPublicUrl(fileName);
        fotoUrls.push(urlData.publicUrl);
      }

      // Uložit inzerát do DB
      const { error: dbError } = await supabase.from("inzeraty").insert({
        title: inzeratForm.title,
        price: parseInt(inzeratForm.price),
        city: inzeratForm.city,
        description: inzeratForm.desc,
        category: inzeratForm.kategorie,
        animal: inzeratForm.zvire,
        condition: inzeratForm.stav,
        foto_urls: fotoUrls,
        seller_id: user.id,
        seller_name: profile?.name || user.email,
      });
      if (dbError) throw dbError;

      setInzeratMsg("🎉 Inzerát byl zveřejněn!");
      setInzeratForm({ title: "", price: "", city: "", desc: "", kategorie: "", zvire: "", stav: "Nový" });
      setFotky([]);
      setFotkyPreviews([]);
      setTimeout(() => { setInzeratMsg(""); setActiveTab("inzeraty"); }, 2000);
    } catch (err) {
      setInzeratMsg("❌ Chyba: " + err.message);
    }
    setInzeratSaving(false);
  };

  const roleLabel = { buyer: "🛒 Kupující", seller: "🏪 Prodejce", vet: "🩺 Veterinář" };

  if (!user) { navigate("/"); return null; }

  const inputStyle = {
    width: "100%", border: "1.5px solid #ede8e0", borderRadius: 10,
    padding: "10px 14px", fontSize: "0.95rem", outline: "none",
    fontFamily: "'DM Sans', sans-serif", background: "#f7f4ef", boxSizing: "border-box", color: "#1c2b22"
  };

  const labelStyle = {
    fontSize: "0.72rem", fontWeight: 600, color: "#8a9e92",
    textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6
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

        {/* Levá lišta */}
        <div style={{ width: 260, flexShrink: 0 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: "24px 20px", marginBottom: 12, border: "1px solid #ede8e0", textAlign: "center" }}>
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#2d6a4f", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.8rem", margin: "0 auto 12px" }}>🐾</div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.15rem", color: "#1c2b22", marginBottom: 6 }}>{profile?.name || user?.email?.split("@")[0]}</div>
            <span style={{ background: "#e8f5ef", color: "#2d6a4f", border: "1px solid #b7d9c7", borderRadius: 20, padding: "3px 12px", fontSize: "0.78rem", fontWeight: 600 }}>
              {roleLabel[role] || "🐾 Uživatel"}
            </span>
          </div>

          <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden", border: "1px solid #ede8e0" }}>
            {MENU.map((item, i) => (
              <button key={item.id} onClick={() => setActiveTab(item.id)} style={{
                width: "100%", padding: "13px 20px", display: "flex", alignItems: "center", gap: 12,
                background: activeTab === item.id ? "#e8f5ef" : "#fff", border: "none",
                borderBottom: i < MENU.length - 1 ? "1px solid #f7f4ef" : "none",
                cursor: "pointer", fontSize: "0.88rem", fontWeight: activeTab === item.id ? 600 : 400,
                color: activeTab === item.id ? "#2d6a4f" : "#4a5e52",
                fontFamily: "'DM Sans', sans-serif", textAlign: "left",
              }}>
                <span>{item.icon}</span>{item.label}
                {activeTab === item.id && <span style={{ marginLeft: "auto", color: "#2d6a4f" }}>›</span>}
              </button>
            ))}
            <button onClick={handleSignOut} style={{ width: "100%", padding: "13px 20px", display: "flex", alignItems: "center", gap: 12, background: "#fff", border: "none", borderTop: "1px solid #f7f4ef", cursor: "pointer", fontSize: "0.88rem", color: "#b91c1c", fontFamily: "'DM Sans', sans-serif", textAlign: "left" }}>
              <span>🚪</span> Odhlásit se
            </button>
          </div>
        </div>

        {/* Hlavní obsah */}
        <div style={{ flex: 1 }}>

          {/* PROFIL */}
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
                    <div key={key}>
                      <label style={labelStyle}>{label}</label>
                      <input value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder} style={inputStyle} />
                    </div>
                  ))}
                  <div>
                    <label style={labelStyle}>O mně</label>
                    <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} placeholder="Něco o sobě..." style={{ ...inputStyle, minHeight: 100, resize: "vertical" }} />
                  </div>
                  {msg && <div style={{ color: msg.includes("Chyba") ? "#b91c1c" : "#166534", fontSize: "0.85rem" }}>{msg}</div>}
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={handleSave} disabled={saving} style={{ flex: 1, background: saving ? "#b5cec0" : "#2d6a4f", color: "#fff", border: "none", borderRadius: 10, padding: "12px", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>{saving ? "Ukládám..." : "💾 Uložit změny"}</button>
                    <button onClick={() => setEditing(false)} style={{ background: "#fff", color: "#6b7280", border: "1.5px solid #ede8e0", borderRadius: 10, padding: "12px 20px", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Zrušit</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MOJE INZERÁTY */}
          {activeTab === "inzeraty" && (
            <div style={{ background: "#fff", borderRadius: 16, padding: "28px 32px", border: "1px solid #ede8e0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.4rem", color: "#1c2b22", margin: 0 }}>Moje inzeráty</h2>
                <button onClick={() => setActiveTab("pridat")} style={{ background: "#2d6a4f", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>+ Přidat</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {mojeInzeraty.length === 0 ? (
  <div style={{ textAlign:"center", padding:"40px", color:"#8a9e92" }}>
    <div style={{ fontSize:"2rem", marginBottom:12 }}>📋</div>
    <p>Zatím žádné inzeráty.</p>
  </div>
) : mojeInzeraty.map(item => (
                  <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px", border: "1px solid #ede8e0", borderRadius: 12, cursor: "pointer" }}
                    onMouseOver={e => e.currentTarget.style.background = "#f7f4ef"}
                    onMouseOut={e => e.currentTarget.style.background = "#fff"}
                  >
                    <div style={{ flex: 1 }}><div style={{ width: 48, height: 48, borderRadius: 10, background: "#e8f5ef", overflow: "hidden", flexShrink: 0 }}>
  {item.foto_urls && item.foto_urls.length > 0
    ? <img src={item.foto_urls[0]} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>🐾</div>}
</div>
                      <div style={{ fontWeight: 600, color: "#1c2b22", marginBottom: 4 }}>{item.title}</div>
                      <div style={{ fontSize: "0.8rem", color: "#8a9e92" }}>👁️ {item.views} zobrazení</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 700, color: "#2d6a4f", fontSize: "1.1rem" }}>{item.price} Kč</div>
                      <span style={{ fontSize: "0.72rem", fontWeight: 600, padding: "2px 10px", borderRadius: 20, background: item.status === "aktivní" ? "#e8f5ef" : "#f3f4f6", color: item.status === "aktivní" ? "#2d6a4f" : "#6b7280" }}>{item.status}</span>
                    </div>
                  </div>
                ))}
        
              </div>
            </div>
          )}

          {/* PŘIDAT INZERÁT */}
          {activeTab === "pridat" && (
            <div style={{ background: "#fff", borderRadius: 16, padding: "28px 32px", border: "1px solid #ede8e0" }}>
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.4rem", color: "#1c2b22", marginBottom: 24 }}>Přidat inzerát</h2>

              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

                {/* FOTKY */}
                <div>
                  <label style={labelStyle}>Fotky (max. 5) *</label>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
                    {fotkyPreviews.map((src, i) => (
                      <div key={i} style={{ position: "relative", width: 90, height: 90 }}>
                        <img src={src} alt="" style={{ width: 90, height: 90, objectFit: "cover", borderRadius: 10, border: "1.5px solid #ede8e0" }} />
                        <button onClick={() => removeFotka(i)} style={{
                          position: "absolute", top: -6, right: -6,
                          width: 22, height: 22, borderRadius: "50%",
                          background: "#b91c1c", color: "#fff", border: "none",
                          cursor: "pointer", fontSize: "0.7rem", fontWeight: 700,
                          display: "flex", alignItems: "center", justifyContent: "center"
                        }}>✕</button>
                      </div>
                    ))}
                    {fotky.length < 5 && (
                      <label style={{
                        width: 90, height: 90, borderRadius: 10,
                        border: "2px dashed #b7d9c7", display: "flex",
                        flexDirection: "column", alignItems: "center", justifyContent: "center",
                        cursor: "pointer", color: "#8a9e92", fontSize: "0.75rem",
                        background: "#f7f4ef", gap: 4,
                      }}>
                        <span style={{ fontSize: "1.5rem" }}>📷</span>
                        Přidat
                        <input type="file" accept="image/*" multiple onChange={handleFotkyChange} style={{ display: "none" }} />
                      </label>
                    )}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#8a9e92" }}>JPG, PNG, WEBP · Max. 5 MB na fotku</div>
                </div>

                {/* NÁZEV */}
                <div>
                  <label style={labelStyle}>Název inzerátu *</label>
                  <input value={inzeratForm.title} onChange={e => setInzeratForm(f => ({ ...f, title: e.target.value }))} placeholder="Pelíšek pro psa, vel. M" style={inputStyle} />
                </div>

                {/* KATEGORIE + ZVÍŘE */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={labelStyle}>Kategorie *</label>
                    <select value={inzeratForm.kategorie} onChange={e => setInzeratForm(f => ({ ...f, kategorie: e.target.value }))} style={{ ...inputStyle, cursor: "pointer" }}>
                      <option value="">Vybrat...</option>
                      {KATEGORIE.map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Zvíře *</label>
                    <select value={inzeratForm.zvire} onChange={e => setInzeratForm(f => ({ ...f, zvire: e.target.value }))} style={{ ...inputStyle, cursor: "pointer" }}>
                      <option value="">Vybrat...</option>
                      {ZVIRATA.map(z => <option key={z} value={z}>{z}</option>)}
                    </select>
                  </div>
                </div>

                {/* CENA + STAV + MĚSTO */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={labelStyle}>Cena (Kč) *</label>
                    <input type="number" value={inzeratForm.price} onChange={e => setInzeratForm(f => ({ ...f, price: e.target.value }))} placeholder="350" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Stav *</label>
                    <select value={inzeratForm.stav} onChange={e => setInzeratForm(f => ({ ...f, stav: e.target.value }))} style={{ ...inputStyle, cursor: "pointer" }}>
                      {STAVY.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Město *</label>
                    <input value={inzeratForm.city} onChange={e => setInzeratForm(f => ({ ...f, city: e.target.value }))} placeholder="Praha" style={inputStyle} />
                  </div>
                </div>

                {/* POPIS */}
                <div>
                  <label style={labelStyle}>Popis</label>
                  <textarea value={inzeratForm.desc} onChange={e => setInzeratForm(f => ({ ...f, desc: e.target.value }))} placeholder="Stav, rozměry, důvod prodeje, případné vady..." style={{ ...inputStyle, minHeight: 120, resize: "vertical" }} />
                </div>

                {inzeratMsg && (
                  <div style={{ background: inzeratMsg.includes("❌") || inzeratMsg.includes("⚠️") ? "#fce4ec" : "#e8f5e9", border: `1px solid ${inzeratMsg.includes("❌") || inzeratMsg.includes("⚠️") ? "#f48fb1" : "#a5d6a7"}`, borderRadius: 10, padding: "10px 14px", fontSize: "0.85rem", color: inzeratMsg.includes("❌") || inzeratMsg.includes("⚠️") ? "#880e4f" : "#1b5e20" }}>
                    {inzeratMsg}
                  </div>
                )}

                <button onClick={handleInzeratSubmit} disabled={inzeratSaving} style={{ background: inzeratSaving ? "#b5cec0" : "#2d6a4f", color: "#fff", border: "none", borderRadius: 10, padding: "14px", fontSize: "1rem", fontWeight: 600, cursor: inzeratSaving ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif", boxShadow: "0 2px 12px rgba(45,106,79,0.25)" }}>
                  {inzeratSaving ? "Zveřejňuji..." : "✓ Zveřejnit inzerát"}
                </button>
              </div>
            </div>
          )}

          {/* PŘÍJMY */}
          {activeTab === "prijmy" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                {[{ label: "Celkové příjmy", value: "600 Kč", icon: "💰" }, { label: "Prodané položky", value: "1", icon: "📦" }, { label: "Aktivní inzeráty", value: "2", icon: "📋" }].map(({ label, value, icon }) => (
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
            </div>
          )}

          {/* HODNOCENÍ */}
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

          {/* ZPRÁVY */}
          {activeTab === "zpravy" && (
            <div style={{ background: "#fff", borderRadius: 16, padding: "28px 32px", border: "1px solid #ede8e0" }}>
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.4rem", color: "#1c2b22", marginBottom: 24 }}>Zprávy</h2>
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#8a9e92" }}>
                <div style={{ fontSize: "3rem", marginBottom: 16 }}>💬</div>
                <p>Zatím žádné zprávy.</p>
              </div>
            </div>
          )}

          {/* HESLO */}
          {activeTab === "heslo" && (
            <div style={{ background: "#fff", borderRadius: 16, padding: "28px 32px", border: "1px solid #ede8e0" }}>
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.4rem", color: "#1c2b22", marginBottom: 24 }}>Změna hesla</h2>
              <div style={{ maxWidth: 400, display: "flex", flexDirection: "column", gap: 16 }}>
                {[{ label: "Nové heslo", key: "new", placeholder: "Min. 6 znaků" }, { label: "Potvrdit heslo", key: "confirm", placeholder: "Zopakuj heslo" }].map(({ label, key, placeholder }) => (
                  <div key={key}>
                    <label style={labelStyle}>{label}</label>
                    <input type="password" value={passwords[key]} onChange={e => setPasswords(p => ({ ...p, [key]: e.target.value }))} placeholder={placeholder} style={inputStyle} />
                  </div>
                ))}
                {pwMsg && <div style={{ color: pwMsg.includes("✅") ? "#166534" : "#b91c1c", fontSize: "0.85rem" }}>{pwMsg}</div>}
                <button onClick={handlePasswordChange} style={{ background: "#2d6a4f", color: "#fff", border: "none", borderRadius: 10, padding: "12px", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>🔒 Změnit heslo</button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}