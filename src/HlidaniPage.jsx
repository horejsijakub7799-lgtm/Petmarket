import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabase";

export default function HlidaniPage() {
  const navigate = useNavigate();
  const [hlidaci, setHlidaci] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [filterCity, setFilterCity] = useState("");

  useEffect(() => { fetchHlidaci(); }, []);

  const fetchHlidaci = async () => {
    const { data } = await supabase.from("partner_profiles").select("*").eq("approved", true).eq("type", "hlidani").order("created_at", { ascending: false });
    if (data) setHlidaci(data);
    setLoading(false);
  };

  const cities = [...new Set(hlidaci.map(h => h.city))].sort();
  const filtered = hlidaci
    .filter(h => !filterCity || h.city === filterCity)
    .filter(h => !search || h.name.toLowerCase().includes(search.toLowerCase()) || h.city.toLowerCase().includes(search.toLowerCase()));

  const inputStyle = { border: "1.5px solid #ede8e0", borderRadius: 30, padding: "10px 18px", fontSize: "0.9rem", outline: "none", fontFamily: "'DM Sans', sans-serif", background: "#fff", color: "#1c2b22" };

  return (
    <div style={{ minHeight: "100vh", background: "#f7f4ef", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600;700&display=swap');`}</style>
      <nav style={{ background: "#fff", borderBottom: "1px solid #ede8e0", height: 64, display: "flex", alignItems: "center", padding: "0 32px", gap: 16, boxShadow: "0 1px 12px rgba(44,80,58,0.07)" }}>
        <button onClick={() => navigate("/")} style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer" }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: "#2d6a4f", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>🐾</div>
          <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.15rem", color: "#1c2b22" }}>Pet Market</span>
        </button>
        <span style={{ color: "#8a9e92", fontSize: "0.85rem" }}>/ Hlídání mazlíčků</span>
        <div style={{ marginLeft: "auto" }}>
          <button onClick={() => navigate("/partneri")} style={{ background: "#2d6a4f", color: "#fff", border: "none", borderRadius: 10, padding: "9px 18px", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>+ Přidat profil</button>
        </div>
      </nav>
      <div style={{ background: "linear-gradient(135deg, #2d6a4f 0%, #3a7d60 100%)", padding: "40px 24px", textAlign: "center" }}>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(1.6rem, 3vw, 2.2rem)", color: "#fff", marginBottom: 8 }}>🏠 Hlídání mazlíčků</h1>
        <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.9rem", marginBottom: 24 }}>Najdi spolehlivého hlídače pro svého mazlíčka</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", maxWidth: 600, margin: "0 auto" }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Hledat hlídače nebo město..." style={{ ...inputStyle, flex: 1, minWidth: 200 }} />
          <select value={filterCity} onChange={e => setFilterCity(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
            <option value="">Všechna města</option>
            {cities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px", color: "#8a9e92" }}>Načítám...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px", color: "#8a9e92" }}>
            <div style={{ fontSize: "3rem", marginBottom: 16 }}>🏠</div>
            <p style={{ marginBottom: 20 }}>Zatím žádní hlídači. Buď první!</p>
            <button onClick={() => navigate("/partneri")} style={{ background: "#2d6a4f", color: "#fff", border: "none", borderRadius: 10, padding: "12px 24px", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Zaregistrovat se</button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
            {filtered.map(h => (
              <div key={h.id} onClick={() => setSelected(h)} style={{ background: "#fff", borderRadius: 16, overflow: "hidden", border: "1.5px solid #ede8e0", boxShadow: "0 2px 12px rgba(44,80,58,0.07)", cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s" }}
                onMouseOver={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(44,80,58,0.14)"; }}
                onMouseOut={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 2px 12px rgba(44,80,58,0.07)"; }}>
                <div style={{ height: 160, background: "linear-gradient(145deg, #e8f5ef, #f2faf6)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
                  {h.foto_urls?.[0] ? <img src={h.foto_urls[0]} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: "4rem" }}>🏠</span>}
                  {h.tier === "premium" && <div style={{ position: "absolute", top: 10, left: 10, background: "#e07b39", color: "#fff", borderRadius: 20, padding: "3px 10px", fontSize: "0.72rem", fontWeight: 700 }}>⭐ Premium</div>}
                </div>
                <div style={{ padding: "16px 18px 20px" }}>
                  <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.1rem", color: "#1c2b22", marginBottom: 6 }}>{h.name}</h3>
                  <div style={{ fontSize: "0.82rem", color: "#8a9e92", marginBottom: 10 }}>📍 {h.city}</div>
                  {h.metadata?.sluzby?.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
                      {h.metadata.sluzby.slice(0, 3).map(s => <span key={s} style={{ background: "#e8f5ef", color: "#2d6a4f", borderRadius: 20, padding: "2px 9px", fontSize: "0.72rem", fontWeight: 600 }}>{s}</span>)}
                    </div>
                  )}
                  <button style={{ width: "100%", background: "#2d6a4f", color: "#fff", border: "none", borderRadius: 8, padding: "9px", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Zobrazit profil →</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {selected && (
        <div onClick={() => setSelected(null)} style={{ position: "fixed", inset: 0, background: "rgba(28,43,34,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(5px)" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 22, maxWidth: 560, width: "100%", maxHeight: "92vh", overflowY: "auto", boxShadow: "0 12px 40px rgba(44,80,58,0.14)" }}>
            <div style={{ height: 220, background: "linear-gradient(145deg, #e8f5ef, #f2faf6)", position: "relative", overflow: "hidden", borderRadius: "22px 22px 0 0" }}>
              {selected.foto_urls?.[0] ? <img src={selected.foto_urls[0]} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "5rem" }}>🏠</div>}
              {selected.tier === "premium" && <div style={{ position: "absolute", top: 14, left: 14, background: "#e07b39", color: "#fff", borderRadius: 20, padding: "4px 12px", fontSize: "0.8rem", fontWeight: 700 }}>⭐ Premium</div>}
              <button onClick={() => setSelected(null)} style={{ position: "absolute", top: 14, right: 14, background: "rgba(255,255,255,0.9)", border: "none", borderRadius: "50%", width: 38, height: 38, cursor: "pointer", fontSize: "1.1rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            </div>
            <div style={{ padding: "24px 28px 28px" }}>
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.4rem", color: "#1c2b22", marginBottom: 6 }}>{selected.name}</h2>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
                {[`📍 ${selected.city}`, `📞 ${selected.phone}`, selected.web && `🌐 ${selected.web}`].filter(Boolean).map(tag => (
                  <span key={tag} style={{ background: "#f7f4ef", border: "1px solid #ede8e0", borderRadius: 20, padding: "4px 12px", fontSize: "0.78rem", color: "#4a5e52" }}>{tag}</span>
                ))}
              </div>
              {selected.description && <p style={{ color: "#4a5e52", fontSize: "0.9rem", lineHeight: 1.65, marginBottom: 18 }}>{selected.description}</p>}
              {selected.metadata?.sluzby?.length > 0 && (
                <div style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "#8a9e92", textTransform: "uppercase", marginBottom: 8 }}>Nabízené služby</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {selected.metadata.sluzby.map(s => <span key={s} style={{ background: "#e8f5ef", color: "#2d6a4f", borderRadius: 20, padding: "3px 10px", fontSize: "0.78rem", fontWeight: 600 }}>{s}</span>)}
                  </div>
                </div>
              )}
              <button onClick={() => selected.phone && window.open(`tel:${selected.phone}`)} style={{ width: "100%", background: "#2d6a4f", color: "#fff", border: "none", borderRadius: 10, padding: "13px", fontSize: "0.95rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>📞 Kontaktovat</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}