import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabase";

const TYPY_VYCVIKU = ["Základní poslušnost", "Agility", "Obrana", "Socializace štěňat", "Klikr trénink", "Záchranářský výcvik", "Sportovní kynologie", "Dog dancing"];
const VEKOVE_KATEGORIE = ["Štěňata", "Dospělí psi", "Senioři"];
const FORMATY = ["Individuální", "Skupinový"];
const MISTA = ["Vlastní cvičiště", "U klienta doma", "Venku (parky/lesy)"];

export default function VycvikRegister() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [fotky, setFotky] = useState([]);
  const [fotkyPreviews, setFotkyPreviews] = useState([]);
  const [registeredEmail, setRegisteredEmail] = useState("");

  const [form, setForm] = useState({
    email: "", password: "", passwordConfirm: "",
    name: "", ico: "", address: "", city: "", phone: "", web: "",
    description: "", experience: "", achievements: "",
    typy_vycviku: [], vekove_kategorie: [], formaty: [], mista: [],
    area_radius_km: "",
    // Ceník
    price_individual: "", duration_individual: "60",
    price_group: "", duration_group: "60",
    kurz_name: "", kurz_price: "", kurz_lekci: "",
    price_note: "",
    tier: "basic",
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const toggleMulti = (key, value) => setForm(p => ({ ...p, [key]: p[key].includes(value) ? p[key].filter(x => x !== value) : [...p[key], value] }));

  const compressImage = (file) => new Promise((resolve) => {
    const canvas = document.createElement("canvas"); const img = new Image();
    img.onload = () => {
      const maxSize = 1200; let w = img.width, h = img.height;
      if (w > h && w > maxSize) { h = (h * maxSize) / w; w = maxSize; } else if (h > maxSize) { w = (w * maxSize) / h; h = maxSize; }
      canvas.width = w; canvas.height = h; canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      canvas.toBlob((blob) => resolve(new File([blob], file.name, { type: "image/jpeg" })), "image/jpeg", 0.8);
    };
    img.src = URL.createObjectURL(file);
  });

  const handleFotky = async (e) => {
    const files = Array.from(e.target.files);
    if (fotky.length + files.length > 8) { setMsg("⚠️ Max. 8 fotek."); return; }
    const compressed = await Promise.all(files.map(compressImage));
    const newFotky = [...fotky, ...compressed].slice(0, 8);
    setFotky(newFotky); setFotkyPreviews(newFotky.map(f => URL.createObjectURL(f)));
  };

  const removeFotka = (idx) => {
    const nf = fotky.filter((_, i) => i !== idx);
    setFotky(nf); setFotkyPreviews(nf.map(f => URL.createObjectURL(f)));
  };

  const handleStep1Next = () => {
    if (!form.email || !form.password) { setMsg("⚠️ Vyplň email a heslo."); return; }
    if (form.password.length < 6) { setMsg("⚠️ Heslo musí mít alespoň 6 znaků."); return; }
    if (form.password !== form.passwordConfirm) { setMsg("⚠️ Hesla se neshodují."); return; }
    if (!form.name || !form.address || !form.city || !form.phone) { setMsg("⚠️ Vyplň všechna povinná pole."); return; }
    setMsg(""); setStep(2);
  };

  const handleStep2Next = () => {
    const hasIndividual = form.price_individual && parseFloat(form.price_individual) > 0;
    const hasGroup = form.price_group && parseFloat(form.price_group) > 0;
    const hasKurz = form.kurz_name && form.kurz_price && parseFloat(form.kurz_price) > 0;
    if (!hasIndividual && !hasGroup && !hasKurz) { setMsg("⚠️ Vyplň alespoň jednu variantu ceníku (individuální, skupinová nebo kurz)."); return; }
    if (form.typy_vycviku.length === 0) { setMsg("⚠️ Vyber alespoň jeden typ výcviku."); return; }
    setMsg(""); setStep(3);
  };

  const geocodeAddress = async (address, city) => {
    try {
      const query = encodeURIComponent(`${address}, ${city}, Czech Republic`);
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`);
      const data = await res.json();
      if (data && data.length > 0) {
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      }
    } catch (e) { console.error("Geocoding failed:", e); }
    return null;
  };

  const handleSubmit = async () => {
    setSaving(true); setMsg("");
    try {
      // 1. Vytvoř účet
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { full_name: form.name, role: "partner" } },
      });
      if (authError) throw authError;

      const userId = authData.user?.id;
      if (!userId) throw new Error("Nepodařilo se vytvořit účet. Zkuste znovu.");

      // 2. Geokódování adresy
      const coords = await geocodeAddress(form.address, form.city);

      // 3. Nahraj fotky
      const fotoUrls = [];
      for (const fotka of fotky) {
        const fileName = `vycvik/${userId}/${Date.now()}_${fotka.name}`;
        const { error: uploadError } = await supabase.storage.from("inzeraty").upload(fileName, fotka);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("inzeraty").getPublicUrl(fileName);
        fotoUrls.push(urlData.publicUrl);
      }

      // 4. Vytvoř partner_profile
      const { error: partnerError } = await supabase.from("partner_profiles").insert({
        user_id: userId,
        type: "vycvik",
        name: form.name,
        ico: form.ico || null,
        address: form.address,
        city: form.city,
        phone: form.phone,
        email: form.email,
        website: form.web,
        description: form.description,
        metadata: {
          experience: form.experience,
          achievements: form.achievements,
          typy_vycviku: form.typy_vycviku,
          vekove_kategorie: form.vekove_kategorie,
          formaty: form.formaty,
          mista: form.mista,
          area_radius_km: parseFloat(form.area_radius_km) || null,
          price_individual: parseFloat(form.price_individual) || null,
          duration_individual: parseInt(form.duration_individual) || null,
          price_group: parseFloat(form.price_group) || null,
          duration_group: parseInt(form.duration_group) || null,
          kurz_name: form.kurz_name || null,
          kurz_price: parseFloat(form.kurz_price) || null,
          kurz_lekci: parseInt(form.kurz_lekci) || null,
          price_note: form.price_note,
        },
        foto_urls: fotoUrls,
        tier: form.tier,
        approved: false,
        ...(coords && { lat: coords.lat, lng: coords.lng }),
      });
      if (partnerError) throw partnerError;

      // 5. Email adminovi
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        await fetch(`${supabaseUrl}/functions/v1/send-order-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${supabaseKey}` },
          body: JSON.stringify({
            sellerEmail: "horejsi.jakub7799@gmail.com",
            sellerName: "Admin",
            order: {
              _isNewRegistration: true,
              _registrantName: form.name,
              _registrantType: "Výcvikové středisko",
              _registrantTier: form.tier,
              buyer_email: form.email,
              buyer_phone: form.phone,
              buyer_address: `${form.address}, ${form.city}`,
            },
          }),
        });
      } catch (e) { console.error("Admin email failed:", e); }

      setRegisteredEmail(form.email);
      setStep(4);
    } catch (err) {
      setMsg("❌ Chyba: " + err.message);
    }
    setSaving(false);
  };

  const inputStyle = { width: "100%", border: "1.5px solid #ede8e0", borderRadius: 10, padding: "11px 14px", fontSize: "0.95rem", outline: "none", fontFamily: "'DM Sans', sans-serif", background: "#f7f4ef", boxSizing: "border-box", color: "#1c2b22" };
  const labelStyle = { fontSize: "0.72rem", fontWeight: 600, color: "#8a9e92", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 };
  const toggleStyle = (active) => ({ padding: "7px 14px", borderRadius: 20, border: `1.5px solid ${active ? "#2d6a4f" : "#ede8e0"}`, background: active ? "#e8f5ef" : "#fff", color: active ? "#2d6a4f" : "#4a5e52", fontSize: "0.82rem", fontWeight: active ? 600 : 400, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" });

  return (
    <div style={{ minHeight: "100vh", background: "#f7f4ef", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600;700&display=swap');`}</style>
      <nav style={{ background: "#fff", borderBottom: "1px solid #ede8e0", height: 64, display: "flex", alignItems: "center", padding: "0 32px", boxShadow: "0 1px 12px rgba(44,80,58,0.07)" }}>
        <button onClick={() => navigate("/")} style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer" }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: "#2d6a4f", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>🐾</div>
          <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.15rem", color: "#1c2b22" }}>Pet Market</span>
        </button>
        <div style={{ marginLeft: "auto", fontSize: "0.85rem", color: "#8a9e92" }}>Registrace výcvikového střediska</div>
      </nav>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "40px 24px" }}>
        {step < 4 && (
          <div style={{ display: "flex", gap: 8, marginBottom: 36, alignItems: "center" }}>
            {["Základní info", "Služby & ceník", "Fotky & plán"].map((label, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: step >= i + 1 ? "#2d6a4f" : "#ede8e0", color: step >= i + 1 ? "#fff" : "#8a9e92", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: 700, flexShrink: 0 }}>{step > i + 1 ? "✓" : i + 1}</div>
                <span style={{ fontSize: "0.78rem", color: step === i + 1 ? "#2d6a4f" : "#8a9e92", fontWeight: step === i + 1 ? 600 : 400 }}>{label}</span>
                {i < 2 && <div style={{ flex: 1, height: 2, background: step > i + 1 ? "#2d6a4f" : "#ede8e0", borderRadius: 2 }} />}
              </div>
            ))}
          </div>
        )}

        {step === 1 && (
          <div style={{ background: "#fff", borderRadius: 20, padding: "32px", boxShadow: "0 4px 20px rgba(44,80,58,0.08)" }}>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.6rem", color: "#1c2b22", marginBottom: 6 }}>🎓 Registrace výcvikového střediska</h1>
            <p style={{ color: "#8a9e92", fontSize: "0.9rem", marginBottom: 28 }}>Po odeslání formulář ověříme a do 24 hodin vás kontaktujeme.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div style={{ background: "#f0f7f4", borderRadius: 12, padding: "16px 18px", border: "1px solid #b7d9c7" }}>
                <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#2d6a4f", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.05em" }}>🔐 Přihlašovací údaje do dashboardu</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div><label style={labelStyle}>Email *</label><input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="info@vas-cvicak.cz" style={inputStyle} /></div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div><label style={labelStyle}>Heslo * (min. 6 znaků)</label><input type="password" value={form.password} onChange={e => set("password", e.target.value)} placeholder="••••••••" style={inputStyle} /></div>
                    <div><label style={labelStyle}>Heslo znovu *</label><input type="password" value={form.passwordConfirm} onChange={e => set("passwordConfirm", e.target.value)} placeholder="••••••••" style={inputStyle} /></div>
                  </div>
                </div>
              </div>
              <div><label style={labelStyle}>Název cvičáku / jméno trenéra *</label><input value={form.name} onChange={e => set("name", e.target.value)} placeholder="Psí škola K9" style={inputStyle} /></div>
              <div><label style={labelStyle}>IČO (nepovinné)</label><input value={form.ico} onChange={e => set("ico", e.target.value)} placeholder="12345678" style={inputStyle} /></div>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
                <div><label style={labelStyle}>Ulice a číslo *</label><input value={form.address} onChange={e => set("address", e.target.value)} placeholder="Václavské náměstí 1" style={inputStyle} /></div>
                <div><label style={labelStyle}>Město *</label><input value={form.city} onChange={e => set("city", e.target.value)} placeholder="Praha" style={inputStyle} /></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div><label style={labelStyle}>Telefon *</label><input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="+420 777 123 456" style={inputStyle} /></div>
                <div><label style={labelStyle}>Web / Instagram</label><input value={form.web} onChange={e => set("web", e.target.value)} placeholder="www.vas-cvicak.cz" style={inputStyle} /></div>
              </div>
              <div><label style={labelStyle}>Spádová oblast (km)</label><input type="number" value={form.area_radius_km} onChange={e => set("area_radius_km", e.target.value)} placeholder="15" style={inputStyle} /><div style={{ fontSize: "0.72rem", color: "#8a9e92", marginTop: 5 }}>Vzdálenost, kam jezdíte za klienty (např. pro individuální výcvik u klienta doma). Zobrazí se jako kruh na mapě.</div></div>
              <div><label style={labelStyle}>Zkušenosti & certifikáty</label><textarea value={form.experience} onChange={e => set("experience", e.target.value)} placeholder="Např. 10 let praxe, certifikát OFA, rozhodčí agility..." style={{ ...inputStyle, minHeight: 80, resize: "vertical" }} /></div>
              <div><label style={labelStyle}>Úspěchy (nepovinné)</label><textarea value={form.achievements} onChange={e => set("achievements", e.target.value)} placeholder="Např. 2× mistr ČR v agility, vítěz mistrovství Evropy..." style={{ ...inputStyle, minHeight: 70, resize: "vertical" }} /></div>
              <div><label style={labelStyle}>O cvičáku / o trenérovi</label><textarea value={form.description} onChange={e => set("description", e.target.value)} placeholder="Co vás dělá jedinečnými? Jakou metodiku používáte?" style={{ ...inputStyle, minHeight: 100, resize: "vertical" }} /></div>
              {msg && <div style={{ color: "#b91c1c", fontSize: "0.85rem" }}>{msg}</div>}
              <button onClick={handleStep1Next} style={{ background: "#2d6a4f", color: "#fff", border: "none", borderRadius: 10, padding: "14px", fontSize: "1rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Pokračovat →</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ background: "#fff", borderRadius: 20, padding: "32px", boxShadow: "0 4px 20px rgba(44,80,58,0.08)" }}>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.4rem", color: "#1c2b22", marginBottom: 24 }}>Služby & ceník</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div>
                <label style={labelStyle}>Typy výcviku *</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                  {TYPY_VYCVIKU.map(s => <button key={s} onClick={() => toggleMulti("typy_vycviku", s)} style={toggleStyle(form.typy_vycviku.includes(s))}>{s}</button>)}
                </div>
              </div>
              <div>
                <label style={labelStyle}>Věkové kategorie</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                  {VEKOVE_KATEGORIE.map(s => <button key={s} onClick={() => toggleMulti("vekove_kategorie", s)} style={toggleStyle(form.vekove_kategorie.includes(s))}>{s}</button>)}
                </div>
              </div>
              <div>
                <label style={labelStyle}>Formát výuky</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                  {FORMATY.map(s => <button key={s} onClick={() => toggleMulti("formaty", s)} style={toggleStyle(form.formaty.includes(s))}>{s}</button>)}
                </div>
              </div>
              <div>
                <label style={labelStyle}>Místo výcviku</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                  {MISTA.map(s => <button key={s} onClick={() => toggleMulti("mista", s)} style={toggleStyle(form.mista.includes(s))}>{s}</button>)}
                </div>
              </div>

              <div style={{ background: "#f0f7f4", borderRadius: 12, padding: "18px", border: "1px solid #b7d9c7" }}>
                <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#2d6a4f", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.05em" }}>💰 Ceník (alespoň jedna varianta)</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                  {/* Individuální */}
                  <div>
                    <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1c2b22", marginBottom: 8 }}>🎯 Individuální lekce</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <div><label style={labelStyle}>Cena (Kč)</label><input type="number" value={form.price_individual} onChange={e => set("price_individual", e.target.value)} placeholder="500" style={inputStyle} /></div>
                      <div><label style={labelStyle}>Délka (min)</label><input type="number" value={form.duration_individual} onChange={e => set("duration_individual", e.target.value)} placeholder="60" style={inputStyle} /></div>
                    </div>
                  </div>

                  {/* Skupinová */}
                  <div>
                    <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1c2b22", marginBottom: 8 }}>👥 Skupinová lekce</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <div><label style={labelStyle}>Cena (Kč)</label><input type="number" value={form.price_group} onChange={e => set("price_group", e.target.value)} placeholder="300" style={inputStyle} /></div>
                      <div><label style={labelStyle}>Délka (min)</label><input type="number" value={form.duration_group} onChange={e => set("duration_group", e.target.value)} placeholder="60" style={inputStyle} /></div>
                    </div>
                  </div>

                  {/* Kurz */}
                  <div>
                    <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1c2b22", marginBottom: 8 }}>📚 Kurz (balíček lekcí)</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <div><label style={labelStyle}>Název kurzu</label><input value={form.kurz_name} onChange={e => set("kurz_name", e.target.value)} placeholder="Základní poslušnost" style={inputStyle} /></div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <div><label style={labelStyle}>Cena (Kč)</label><input type="number" value={form.kurz_price} onChange={e => set("kurz_price", e.target.value)} placeholder="2400" style={inputStyle} /></div>
                        <div><label style={labelStyle}>Počet lekcí</label><input type="number" value={form.kurz_lekci} onChange={e => set("kurz_lekci", e.target.value)} placeholder="10" style={inputStyle} /></div>
                      </div>
                    </div>
                  </div>

                  {/* Poznámka */}
                  <div>
                    <label style={labelStyle}>Poznámka k ceně (nepovinné)</label>
                    <input value={form.price_note} onChange={e => set("price_note", e.target.value)} placeholder="Např. První konzultace zdarma, slevy pro útulky..." style={inputStyle} />
                  </div>
                </div>
              </div>

              {msg && <div style={{ color: "#b91c1c", fontSize: "0.85rem" }}>{msg}</div>}
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setStep(1)} style={{ background: "#fff", color: "#4a5e52", border: "1.5px solid #ede8e0", borderRadius: 10, padding: "12px 20px", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>← Zpět</button>
                <button onClick={handleStep2Next} style={{ flex: 1, background: "#2d6a4f", color: "#fff", border: "none", borderRadius: 10, padding: "14px", fontSize: "1rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Pokračovat →</button>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ background: "#fff", borderRadius: 20, padding: "32px", boxShadow: "0 4px 20px rgba(44,80,58,0.08)" }}>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.4rem", color: "#1c2b22", marginBottom: 24 }}>Fotky & výběr plánu</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div>
                <label style={labelStyle}>Fotky cvičáku (max. 8)</label>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 8 }}>
                  {fotkyPreviews.map((src, i) => (
                    <div key={i} style={{ position: "relative", width: 90, height: 90 }}>
                      <img src={src} alt="" style={{ width: 90, height: 90, objectFit: "cover", borderRadius: 10, border: "1.5px solid #ede8e0" }} />
                      <button onClick={() => removeFotka(i)} style={{ position: "absolute", top: -6, right: -6, width: 22, height: 22, borderRadius: "50%", background: "#b91c1c", color: "#fff", border: "none", cursor: "pointer", fontSize: "0.7rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                    </div>
                  ))}
                  {fotky.length < 8 && (
                    <label style={{ width: 90, height: 90, borderRadius: 10, border: "2px dashed #b7d9c7", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#8a9e92", fontSize: "0.75rem", background: "#f7f4ef", gap: 4 }}>
                      <span style={{ fontSize: "1.5rem" }}>📷</span>Přidat
                      <input type="file" accept="image/*" multiple onChange={handleFotky} style={{ display: "none" }} />
                    </label>
                  )}
                </div>
              </div>
              <div>
                <label style={labelStyle}>Vyberte plán</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 8 }}>
                  {[
                    { id: "basic", name: "Basic", price: "199 Kč/měsíc", features: ["Profil v adresáři", "Zobrazení na mapě", "Hodnocení zákazníků", "Max. 3 fotky"] },
                    { id: "premium", name: "Premium", price: "399 Kč/měsíc", features: ["Vše z Basic", "Neomezeně fotek", "Prioritní zobrazení", "Statistiky profilu", "Badge \"Ověřený trenér\""] },
                  ].map(plan => (
                    <div key={plan.id} onClick={() => set("tier", plan.id)} style={{ border: `2px solid ${form.tier === plan.id ? "#2d6a4f" : "#ede8e0"}`, borderRadius: 14, padding: "20px", cursor: "pointer", background: form.tier === plan.id ? "#f2faf6" : "#fff" }}>
                      <div style={{ fontWeight: 700, color: "#1c2b22", fontSize: "1rem", marginBottom: 4 }}>{plan.name}</div>
                      <div style={{ color: "#2d6a4f", fontWeight: 700, fontSize: "1.1rem", fontFamily: "'DM Serif Display', serif", marginBottom: 12 }}>{plan.price}</div>
                      {plan.features.map(f => <div key={f} style={{ fontSize: "0.78rem", color: "#4a5e52", display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}><span style={{ color: "#2d6a4f", fontWeight: 700 }}>✓</span>{f}</div>)}
                    </div>
                  ))}
                </div>
              </div>
              {msg && <div style={{ background: "#fce4ec", border: "1px solid #f48fb1", borderRadius: 10, padding: "10px 14px", fontSize: "0.85rem", color: "#880e4f" }}>{msg}</div>}
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setStep(2)} style={{ background: "#fff", color: "#4a5e52", border: "1.5px solid #ede8e0", borderRadius: 10, padding: "12px 20px", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>← Zpět</button>
                <button onClick={handleSubmit} disabled={saving} style={{ flex: 1, background: saving ? "#b5cec0" : "#2d6a4f", color: "#fff", border: "none", borderRadius: 10, padding: "14px", fontSize: "1rem", fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif" }}>{saving ? "Odesílám..." : "✓ Odeslat ke schválení"}</button>
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div style={{ background: "#fff", borderRadius: 20, padding: "48px 32px", boxShadow: "0 4px 20px rgba(44,80,58,0.08)", textAlign: "center" }}>
            <div style={{ fontSize: "4rem", marginBottom: 20 }}>🎉</div>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.6rem", color: "#1c2b22", marginBottom: 12 }}>Žádost odeslána!</h2>
            <p style={{ color: "#4a5e52", fontSize: "0.95rem", lineHeight: 1.7, marginBottom: 12 }}>Do <strong>24 hodin</strong> vás budeme kontaktovat na email <strong>{registeredEmail}</strong>.</p>
            <p style={{ color: "#8a9e92", fontSize: "0.85rem", marginBottom: 32 }}>Po schválení se přihlaste na Pet Market pomocí zadaného emailu a hesla — automaticky se dostanete do svého dashboardu.</p>
            <button onClick={() => navigate("/")} style={{ background: "#2d6a4f", color: "#fff", border: "none", borderRadius: 10, padding: "14px 32px", fontSize: "1rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Zpět na Pet Market</button>
          </div>
        )}
      </div>
    </div>
  );
}