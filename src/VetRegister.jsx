import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabase";

const SPECIALIZACE = [
  "Malá zvířata", "Velká zvířata", "Exotická zvířata", "Chirurgie",
  "Dermatologie", "Ortopedie", "Oftalmologie", "Zuby & ústní hygiena",
  "Onkologie", "Kardiologie", "Neurologie", "Záchranná medicína",
];

const DNY = ["Po", "Út", "St", "Čt", "Pá", "So", "Ne"];

export default function VetRegister() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [fotky, setFotky] = useState([]);
  const [fotkyPreviews, setFotkyPreviews] = useState([]);
  const [registeredEmail, setRegisteredEmail] = useState("");

  const [form, setForm] = useState({
    email: "", password: "", passwordConfirm: "",
    clinic_name: "", ico: "", address: "", city: "", phone: "", web: "",
    description: "", specializations: [], tier: "basic",
    opening_hours: {
      Po: { open: "08:00", close: "17:00", closed: false },
      Út: { open: "08:00", close: "17:00", closed: false },
      St: { open: "08:00", close: "17:00", closed: false },
      Čt: { open: "08:00", close: "17:00", closed: false },
      Pá: { open: "08:00", close: "17:00", closed: false },
      So: { open: "09:00", close: "12:00", closed: true },
      Ne: { open: "09:00", close: "12:00", closed: true },
    },
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const toggleSpec = (s) => setForm(p => ({ ...p, specializations: p.specializations.includes(s) ? p.specializations.filter(x => x !== s) : [...p.specializations, s] }));

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
    if (!form.clinic_name || !form.ico || !form.address || !form.city || !form.phone) { setMsg("⚠️ Vyplň všechna povinná pole."); return; }
    setMsg(""); setStep(2);
  };

  const handleSubmit = async () => {
    setSaving(true); setMsg("");
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({ email: form.email, password: form.password });
      if (authError) throw authError;
      const userId = authData.user?.id;
      if (!userId) throw new Error("Nepodařilo se vytvořit účet.");

      const fotoUrls = [];
      for (const fotka of fotky) {
        const fileName = `vet/${userId}/${Date.now()}_${fotka.name}`;
        const { error: uploadError } = await supabase.storage.from("inzeraty").upload(fileName, fotka);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("inzeraty").getPublicUrl(fileName);
        fotoUrls.push(urlData.publicUrl);
      }

      const { error } = await supabase.from("vet_profiles").insert({
        user_id: userId,
        clinic_name: form.clinic_name,
        ico: form.ico,
        address: form.address,
        city: form.city,
        phone: form.phone,
        email: form.email,
        web: form.web,
        description: form.description,
        specializations: form.specializations,
        opening_hours: form.opening_hours,
        foto_urls: fotoUrls,
        tier: form.tier,
        approved: false,
      });
      if (error) throw error;

      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        await fetch(`${supabaseUrl}/functions/v1/send-order-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${supabaseKey}` },
          body: JSON.stringify({ sellerEmail: "horejsi.jakub7799@gmail.com", sellerName: "Admin",
            order: { _isNewRegistration: true, _registrantName: form.clinic_name, _registrantType: "Veterinární klinika",
              _registrantTier: form.tier, buyer_email: form.email, buyer_phone: form.phone,
              buyer_address: `${form.address}, ${form.city}` } }),
        });
      } catch (e) { console.error("Admin email failed:", e); }

      setRegisteredEmail(form.email);
      setStep(4);
    } catch (err) { setMsg("❌ Chyba: " + err.message); }
    setSaving(false);
  };

  const inputStyle = { width: "100%", border: "1.5px solid #ede8e0", borderRadius: 10, padding: "11px 14px", fontSize: "0.95rem", outline: "none", fontFamily: "'DM Sans', sans-serif", background: "#f7f4ef", boxSizing: "border-box", color: "#1c2b22" };
  const labelStyle = { fontSize: "0.72rem", fontWeight: 600, color: "#8a9e92", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 };

  return (
    <div style={{ minHeight: "100vh", background: "#f7f4ef", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600;700&display=swap');`}</style>
      <nav style={{ background: "#fff", borderBottom: "1px solid #ede8e0", height: 64, display: "flex", alignItems: "center", padding: "0 32px", gap: 16, boxShadow: "0 1px 12px rgba(44,80,58,0.07)" }}>
        <button onClick={() => navigate("/")} style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer" }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: "#2d6a4f", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>🐾</div>
          <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.15rem", color: "#1c2b22" }}>Pet Market</span>
        </button>
        <div style={{ marginLeft: "auto", fontSize: "0.85rem", color: "#8a9e92" }}>Registrace veterinární kliniky</div>
      </nav>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "40px 24px" }}>
        {step < 4 && (
          <div style={{ display: "flex", gap: 8, marginBottom: 36, alignItems: "center" }}>
            {["Základní info", "Specializace & hodiny", "Fotky & plán"].map((label, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: step > i + 1 ? "#2d6a4f" : step === i + 1 ? "#2d6a4f" : "#ede8e0", color: step >= i + 1 ? "#fff" : "#8a9e92", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: 700, flexShrink: 0 }}>{step > i + 1 ? "✓" : i + 1}</div>
                <span style={{ fontSize: "0.78rem", color: step === i + 1 ? "#2d6a4f" : "#8a9e92", fontWeight: step === i + 1 ? 600 : 400 }}>{label}</span>
                {i < 2 && <div style={{ flex: 1, height: 2, background: step > i + 1 ? "#2d6a4f" : "#ede8e0", borderRadius: 2 }} />}
              </div>
            ))}
          </div>
        )}

        {step === 1 && (
          <div style={{ background: "#fff", borderRadius: 20, padding: "32px", boxShadow: "0 4px 20px rgba(44,80,58,0.08)" }}>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.6rem", color: "#1c2b22", marginBottom: 6 }}>🩺 Registrace kliniky</h1>
            <p style={{ color: "#8a9e92", fontSize: "0.9rem", marginBottom: 28 }}>Po odeslání formulář ručně ověříme a do 24 hodin vás kontaktujeme.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div style={{ background: "#f0f7f4", borderRadius: 12, padding: "16px 18px", border: "1px solid #b7d9c7" }}>
                <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#2d6a4f", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.05em" }}>🔐 Přihlašovací údaje do dashboardu</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div><label style={labelStyle}>Email *</label><input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="klinika@vas-vet.cz" style={inputStyle} /></div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div><label style={labelStyle}>Heslo * (min. 6 znaků)</label><input type="password" value={form.password} onChange={e => set("password", e.target.value)} placeholder="••••••••" style={inputStyle} /></div>
                    <div><label style={labelStyle}>Heslo znovu *</label><input type="password" value={form.passwordConfirm} onChange={e => set("passwordConfirm", e.target.value)} placeholder="••••••••" style={inputStyle} /></div>
                  </div>
                </div>
              </div>
              <div><label style={labelStyle}>Název kliniky *</label><input value={form.clinic_name} onChange={e => set("clinic_name", e.target.value)} placeholder="Veterinární klinika Praha s.r.o." style={inputStyle} /></div>
              <div><label style={labelStyle}>IČO *</label><input value={form.ico} onChange={e => set("ico", e.target.value)} placeholder="12345678" style={inputStyle} /><div style={{ fontSize: "0.72rem", color: "#8a9e92", marginTop: 5 }}>Ověřujeme přes ARES — zadej IČO přesně jak je v rejstříku</div></div>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
                <div><label style={labelStyle}>Ulice a číslo popisné *</label><input value={form.address} onChange={e => set("address", e.target.value)} placeholder="Václavské náměstí 1" style={inputStyle} /></div>
                <div><label style={labelStyle}>Město *</label><input value={form.city} onChange={e => set("city", e.target.value)} placeholder="Praha" style={inputStyle} /></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div><label style={labelStyle}>Telefon *</label><input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="+420 777 123 456" style={inputStyle} /></div>
                <div><label style={labelStyle}>Web</label><input value={form.web} onChange={e => set("web", e.target.value)} placeholder="www.vase-klinika.cz" style={inputStyle} /></div>
              </div>
              <div><label style={labelStyle}>Popis kliniky</label><textarea value={form.description} onChange={e => set("description", e.target.value)} placeholder="Moderní veterinární klinika s 15letou tradicí..." style={{ ...inputStyle, minHeight: 100, resize: "vertical" }} /></div>
              {msg && <div style={{ color: "#b91c1c", fontSize: "0.85rem" }}>{msg}</div>}
              <button onClick={handleStep1Next} style={{ background: "#2d6a4f", color: "#fff", border: "none", borderRadius: 10, padding: "14px", fontSize: "1rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Pokračovat →</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ background: "#fff", borderRadius: 20, padding: "32px", boxShadow: "0 4px 20px rgba(44,80,58,0.08)" }}>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.4rem", color: "#1c2b22", marginBottom: 24 }}>Specializace & otevírací doba</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div>
                <label style={labelStyle}>Specializace</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                  {SPECIALIZACE.map(s => (
                    <button key={s} onClick={() => toggleSpec(s)} style={{ padding: "7px 14px", borderRadius: 20, border: `1.5px solid ${form.specializations.includes(s) ? "#2d6a4f" : "#ede8e0"}`, background: form.specializations.includes(s) ? "#e8f5ef" : "#fff", color: form.specializations.includes(s) ? "#2d6a4f" : "#4a5e52", fontSize: "0.82rem", fontWeight: form.specializations.includes(s) ? 600 : 400, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>{s}</button>
                  ))}
                </div>
              </div>
              <div>
                <label style={labelStyle}>Otevírací doba</label>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                  {DNY.map(den => (
                    <div key={den} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ width: 28, fontSize: "0.85rem", fontWeight: 600, color: "#1c2b22" }}>{den}</span>
                      <input type="checkbox" checked={!form.opening_hours[den].closed} onChange={e => setForm(p => ({ ...p, opening_hours: { ...p.opening_hours, [den]: { ...p.opening_hours[den], closed: !e.target.checked } } }))} style={{ accentColor: "#2d6a4f", width: 16, height: 16 }} />
                      {!form.opening_hours[den].closed ? (
                        <>
                          <input type="time" value={form.opening_hours[den].open} onChange={e => setForm(p => ({ ...p, opening_hours: { ...p.opening_hours, [den]: { ...p.opening_hours[den], open: e.target.value } } }))} style={{ ...inputStyle, width: 110, padding: "8px 10px" }} />
                          <span style={{ color: "#8a9e92" }}>—</span>
                          <input type="time" value={form.opening_hours[den].close} onChange={e => setForm(p => ({ ...p, opening_hours: { ...p.opening_hours, [den]: { ...p.opening_hours[den], close: e.target.value } } }))} style={{ ...inputStyle, width: 110, padding: "8px 10px" }} />
                        </>
                      ) : <span style={{ fontSize: "0.82rem", color: "#b91c1c", fontWeight: 600 }}>Zavřeno</span>}
                    </div>
                  ))}
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
                <label style={labelStyle}>Fotky kliniky (max. 8)</label>
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
                    { id: "basic", name: "Basic", price: "1 490 Kč/měsíc", features: ["Profil v adresáři", "Zobrazení na mapě", "Otevírací doba", "Hodnocení zákazníků"] },
                    { id: "premium", name: "Premium", price: "2 490 Kč/měsíc", features: ["Vše z Basic", "Chat se zákazníky", "Zvýraznění na mapě", "Prioritní zobrazení", "Badge Ověřená klinika", "Statistiky profilu"] },
                  ].map(plan => (
                    <div key={plan.id} onClick={() => set("tier", plan.id)} style={{ border: `2px solid ${form.tier === plan.id ? "#2d6a4f" : "#ede8e0"}`, borderRadius: 14, padding: "20px", cursor: "pointer", background: form.tier === plan.id ? "#f2faf6" : "#fff" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                        <div>
                          <div style={{ fontWeight: 700, color: "#1c2b22", fontSize: "1rem" }}>{plan.name}</div>
                          <div style={{ color: "#2d6a4f", fontWeight: 700, fontSize: "1.1rem", fontFamily: "'DM Serif Display', serif" }}>{plan.price}</div>
                        </div>
                        {plan.id === "premium" && <span style={{ background: "#e07b39", color: "#fff", borderRadius: 20, padding: "2px 10px", fontSize: "0.7rem", fontWeight: 700 }}>Doporučeno</span>}
                        {form.tier === plan.id && <span style={{ color: "#2d6a4f", fontSize: "1.2rem" }}>✓</span>}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                        {plan.features.map(f => <div key={f} style={{ fontSize: "0.78rem", color: "#4a5e52", display: "flex", alignItems: "center", gap: 6 }}><span style={{ color: "#2d6a4f", fontWeight: 700 }}>✓</span>{f}</div>)}
                      </div>
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
            <p style={{ color: "#4a5e52", fontSize: "0.95rem", lineHeight: 1.7, marginBottom: 12 }}>Vaši kliniku ověříme přes ARES a do <strong>24 hodin</strong> vás budeme kontaktovat na email <strong>{registeredEmail}</strong>.</p>
            <p style={{ color: "#8a9e92", fontSize: "0.85rem", marginBottom: 32 }}>Po schválení se přihlaste na <strong>petmarket-theta.vercel.app/partner/dashboard</strong> pomocí zadaného emailu a hesla.</p>
            <button onClick={() => navigate("/")} style={{ background: "#2d6a4f", color: "#fff", border: "none", borderRadius: 10, padding: "14px 32px", fontSize: "1rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Zpět na Pet Market</button>
          </div>
        )}
      </div>
    </div>
  );
}