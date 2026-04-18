import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabase";
import { useAuth } from "./useAuth";

const SLUZBY = ["Celodenní hlídání", "Noční hlídání", "Krátkodobé hlídání", "Hlídání o víkendu", "Hlídání svátky", "Venčení v rámci hlídání", "Koupání", "Podávání léků"];
const ZVIRATA = ["Psi", "Kočky", "Hlodavci", "Ptáci", "Plazi", "Jiná zvířata"];
const HOME_TYPES = ["Byt", "Dům se zahradou", "Dům bez zahrady"];

export default function HlidaniRegister() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [fotky, setFotky] = useState([]);
  const [fotkyPreviews, setFotkyPreviews] = useState([]);

  const [form, setForm] = useState({
    name: "", address: "", city: "", phone: "", web: "",
    description: "", experience: "", sluzby: [], zvirata: [],
    price_per_day: "", price_per_hour: "", max_animals: "1",
    home_type: "", has_own_dog: false,
    tier: "basic",
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const toggle = (key, s) => setForm(p => ({ ...p, [key]: p[key].includes(s) ? p[key].filter(x => x !== s) : [...p[key], s] }));

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
    if (fotky.length + files.length > 5) { setMsg("⚠️ Max. 5 fotek."); return; }
    const compressed = await Promise.all(files.map(compressImage));
    const newFotky = [...fotky, ...compressed].slice(0, 5);
    setFotky(newFotky); setFotkyPreviews(newFotky.map(f => URL.createObjectURL(f)));
  };

  const removeFotka = (idx) => {
    const nf = fotky.filter((_, i) => i !== idx);
    setFotky(nf); setFotkyPreviews(nf.map(f => URL.createObjectURL(f)));
  };

  const handleSubmit = async () => {
    if (!user) { setMsg("⚠️ Musíš být přihlášen."); return; }
    setSaving(true); setMsg("");
    try {
      // Nahrání fotek
      const fotoUrls = [];
      for (const fotka of fotky) {
        const fileName = `hlidani/${user.id}/${Date.now()}_${fotka.name}`;
        const { error: uploadError } = await supabase.storage.from("inzeraty").upload(fileName, fotka);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("inzeraty").getPublicUrl(fileName);
        fotoUrls.push(urlData.publicUrl);
      }

      // 1. Uložení do partner_profiles (společná data)
      const { data: partner, error: partnerError } = await supabase
        .from("partner_profiles")
        .insert({
          user_id: user.id,
          type: "hlidani",
          name: form.name,
          address: form.address,
          city: form.city,
          phone: form.phone,
          email: user.email,
          website: form.web,
          description: form.description,
          metadata: { experience: form.experience, sluzby: form.sluzby, zvirata: form.zvirata },
          foto_urls: fotoUrls,
          tier: form.tier,
          approved: false,
        })
        .select()
        .single();

      if (partnerError) throw partnerError;

      // 2. Uložení do hlidani_profiles (specifická data hlídače)
      const { error: hlidaniError } = await supabase
        .from("hlidani_profiles")
        .insert({
          partner_id: partner.id,
          price_per_day: parseFloat(form.price_per_day) || null,
          price_per_hour: parseFloat(form.price_per_hour) || null,
          max_animals: parseInt(form.max_animals) || 1,
          home_type: form.home_type || null,
          has_own_dog: form.has_own_dog,
        });

      if (hlidaniError) throw hlidaniError;

      setStep(4);
    } catch (err) { setMsg("❌ Chyba: " + err.message); }
    setSaving(false);
  };

  const inputStyle = { width: "100%", border: "1.5px solid #ede8e0", borderRadius: 10, padding: "11px 14px", fontSize: "0.95rem", outline: "none", fontFamily: "'DM Sans', sans-serif", background: "#f7f4ef", boxSizing: "border-box", color: "#1c2b22" };
  const labelStyle = { fontSize: "0.72rem", fontWeight: 600, color: "#8a9e92", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 };
  const chipStyle = (active) => ({ padding: "7px 14px", borderRadius: 20, border: `1.5px solid ${active ? "#2d6a4f" : "#ede8e0"}`, background: active ? "#e8f5ef" : "#fff", color: active ? "#2d6a4f" : "#4a5e52", fontSize: "0.82rem", fontWeight: active ? 600 : 400, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" });

  return (
    <div style={{ minHeight: "100vh", background: "#f7f4ef", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600;700&display=swap');`}</style>
      <nav style={{ background: "#fff", borderBottom: "1px solid #ede8e0", height: 64, display: "flex", alignItems: "center", padding: "0 32px", boxShadow: "0 1px 12px rgba(44,80,58,0.07)" }}>
        <button onClick={() => navigate("/")} style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer" }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: "#2d6a4f", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>🐾</div>
          <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.15rem", color: "#1c2b22" }}>Pet Market</span>
        </button>
        <div style={{ marginLeft: "auto", fontSize: "0.85rem", color: "#8a9e92" }}>Registrace hlídače mazlíčků</div>
      </nav>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "40px 24px" }}>
        {step < 4 && (
          <div style={{ display: "flex", gap: 8, marginBottom: 36, alignItems: "center" }}>
            {["Základní info", "Služby & zvířata", "Fotky & plán"].map((label, i) => (
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
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.6rem", color: "#1c2b22", marginBottom: 6 }}>🏠 Registrace hlídače</h1>
            <p style={{ color: "#8a9e92", fontSize: "0.9rem", marginBottom: 28 }}>Po odeslání formulář ověříme a do 24 hodin vás kontaktujeme.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div><label style={labelStyle}>Celé jméno *</label><input value={form.name} onChange={e => set("name", e.target.value)} placeholder="Jana Nováková" style={inputStyle} /></div>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
                <div><label style={labelStyle}>Ulice a číslo *</label><input value={form.address} onChange={e => set("address", e.target.value)} placeholder="Václavské náměstí 1" style={inputStyle} /></div>
                <div><label style={labelStyle}>Město *</label><input value={form.city} onChange={e => set("city", e.target.value)} placeholder="Praha" style={inputStyle} /></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div><label style={labelStyle}>Telefon *</label><input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="+420 777 123 456" style={inputStyle} /></div>
                <div><label style={labelStyle}>Web / Instagram</label><input value={form.web} onChange={e => set("web", e.target.value)} placeholder="@hlidam_mazlicky" style={inputStyle} /></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <div><label style={labelStyle}>Cena za den (Kč)</label><input type="number" value={form.price_per_day} onChange={e => set("price_per_day", e.target.value)} placeholder="400" style={inputStyle} /></div>
                <div><label style={labelStyle}>Cena za hodinu (Kč)</label><input type="number" value={form.price_per_hour} onChange={e => set("price_per_hour", e.target.value)} placeholder="80" style={inputStyle} /></div>
                <div><label style={labelStyle}>Max. počet zvířat</label><input type="number" value={form.max_animals} onChange={e => set("max_animals", e.target.value)} placeholder="1" min="1" max="10" style={inputStyle} /></div>
              </div>
              <div>
                <label style={labelStyle}>Typ bydlení</label>
                <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                  {HOME_TYPES.map(t => (
                    <button key={t} onClick={() => set("home_type", form.home_type === t ? "" : t)} style={chipStyle(form.home_type === t)}>{t}</button>
                  ))}
                </div>
              </div>
              <div>
                <label style={labelStyle}>Další informace</label>
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button onClick={() => set("has_own_dog", !form.has_own_dog)} style={chipStyle(form.has_own_dog)}>Mám vlastního psa</button>
                </div>
              </div>
              <div><label style={labelStyle}>Zkušenosti</label><input value={form.experience} onChange={e => set("experience", e.target.value)} placeholder="Např. 5 let zkušeností, absolvovaný kurz..." style={inputStyle} /></div>
              <div><label style={labelStyle}>O mně</label><textarea value={form.description} onChange={e => set("description", e.target.value)} placeholder="Miluji zvířata a mám s nimi bohaté zkušenosti..." style={{ ...inputStyle, minHeight: 100, resize: "vertical" }} /></div>
              {msg && <div style={{ color: "#b91c1c", fontSize: "0.85rem" }}>{msg}</div>}
              <button onClick={() => { if (!form.name || !form.address || !form.city || !form.phone) { setMsg("⚠️ Vyplň všechna povinná pole."); return; } setMsg(""); setStep(2); }} style={{ background: "#2d6a4f", color: "#fff", border: "none", borderRadius: 10, padding: "14px", fontSize: "1rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Pokračovat →</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ background: "#fff", borderRadius: 20, padding: "32px", boxShadow: "0 4px 20px rgba(44,80,58,0.08)" }}>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.4rem", color: "#1c2b22", marginBottom: 24 }}>Služby & zvířata</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div>
                <label style={labelStyle}>Nabízené služby</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                  {SLUZBY.map(s => <button key={s} onClick={() => toggle("sluzby", s)} style={chipStyle(form.sluzby.includes(s))}>{s}</button>)}
                </div>
              </div>
              <div>
                <label style={labelStyle}>Přijímám zvířata</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                  {ZVIRATA.map(s => <button key={s} onClick={() => toggle("zvirata", s)} style={chipStyle(form.zvirata.includes(s))}>{s}</button>)}
                </div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setStep(1)} style={{ background: "#fff", color: "#4a5e52", border: "1.5px solid #ede8e0", borderRadius: 10, padding: "12px 20px", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>← Zpět</button>
                <button onClick={() => setStep(3)} style={{ flex: 1, background: "#2d6a4f", color: "#fff", border: "none", borderRadius: 10, padding: "14px", fontSize: "1rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Pokračovat →</button>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ background: "#fff", borderRadius: 20, padding: "32px", boxShadow: "0 4px 20px rgba(44,80,58,0.08)" }}>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.4rem", color: "#1c2b22", marginBottom: 24 }}>Fotky & výběr plánu</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div>
                <label style={labelStyle}>Fotky (max. 5)</label>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 8 }}>
                  {fotkyPreviews.map((src, i) => (
                    <div key={i} style={{ position: "relative", width: 90, height: 90 }}>
                      <img src={src} alt="" style={{ width: 90, height: 90, objectFit: "cover", borderRadius: 10, border: "1.5px solid #ede8e0" }} />
                      <button onClick={() => removeFotka(i)} style={{ position: "absolute", top: -6, right: -6, width: 22, height: 22, borderRadius: "50%", background: "#b91c1c", color: "#fff", border: "none", cursor: "pointer", fontSize: "0.7rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                    </div>
                  ))}
                  {fotky.length < 5 && (
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
                    { id: "basic", name: "Basic", price: "199 Kč/měsíc", features: ["Profil v adresáři", "Zobrazení na mapě", "Hodnocení zákazníků"] },
                    { id: "premium", name: "Premium", price: "399 Kč/měsíc", features: ["Vše z Basic", "Chat se zákazníky", "Prioritní zobrazení", "Statistiky profilu"] },
                  ].map(plan => (
                    <div key={plan.id} onClick={() => set("tier", plan.id)} style={{ border: `2px solid ${form.tier === plan.id ? "#2d6a4f" : "#ede8e0"}`, borderRadius: 14, padding: "20px", cursor: "pointer", background: form.tier === plan.id ? "#f2faf6" : "#fff" }}>
                      <div style={{ fontWeight: 700, color: "#1c2b22", fontSize: "1rem", marginBottom: 4 }}>{plan.name}</div>
                      <div style={{ color: "#2d6a4f", fontWeight: 700, fontSize: "1.1rem", fontFamily: "'DM Serif Display', serif", marginBottom: 12 }}>{plan.price}</div>
                      {plan.features.map(f => <div key={f} style={{ fontSize: "0.78rem", color: "#4a5e52", display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}><span style={{ color: "#2d6a4f", fontWeight: 700 }}>✓</span>{f}</div>)}
                    </div>
                  ))}
                </div>
              </div>
              {msg && <div style={{ color: "#b91c1c", fontSize: "0.85rem" }}>{msg}</div>}
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
            <p style={{ color: "#4a5e52", fontSize: "0.95rem", lineHeight: 1.7, marginBottom: 32 }}>Do <strong>24 hodin</strong> vás budeme kontaktovat na email <strong>{user?.email}</strong>.</p>
            <button onClick={() => navigate("/")} style={{ background: "#2d6a4f", color: "#fff", border: "none", borderRadius: 10, padding: "14px 32px", fontSize: "1rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Zpět na Pet Market</button>
          </div>
        )}
      </div>
    </div>
  );
}