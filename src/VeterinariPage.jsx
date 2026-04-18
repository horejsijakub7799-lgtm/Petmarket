import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabase";

export default function VeterinariPage() {
  const navigate = useNavigate();
  const [kliniky, setKliniky] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [filterCity, setFilterCity] = useState("");

  useEffect(() => { fetchKliniky(); }, []);

  const fetchKliniky = async () => {
    const { data } = await supabase
      .from("vet_profiles")
      .select("*")
      .eq("approved", true)
      .order("created_at", { ascending: false });
    if (data) setKliniky(data);
    setLoading(false);
  };

  const now = new Date();
  const cities = [...new Set(kliniky.map(k => k.city))].sort();
  const filtered = kliniky
    .filter(k => !filterCity || k.city === filterCity)
    .filter(k => !search || k.clinic_name.toLowerCase().includes(search.toLowerCase()) || k.city.toLowerCase().includes(search.toLowerCase()));

  const boosted = filtered.filter(k => k.boosted_until && new Date(k.boosted_until) > now);
  const normal = filtered.filter(k => !k.boosted_until || new Date(k.boosted_until) <= now);
  const sorted = [...boosted, ...normal];

  const inputStyle = { border: "1.5px solid #ede8e0", borderRadius: 30, padding: "10px 18px", fontSize: "0.9rem", outline: "none", fontFamily: "'DM Sans', sans-serif", background: "#fff", color: "#1c2b22" };

  const KlinikaCard = ({ k }) => {
    const isBoosted = k.boosted_until && new Date(k.boosted_until) > now;
    return (
      <div onClick={() => setSelected(k)}
        style={{ background: "#fff", borderRadius: 16, overflow: "hidden", border: isBoosted ? "2px solid #e07b39" : "1.5px solid #ede8e0", boxShadow: isBoosted ? "0 4px 20px rgba(224,123,57,0.18)" : "0 2px 12px rgba(44,80,58,0.07)", cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s", position: "relative" }}
        onMouseOver={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = isBoosted ? "0 8px 28px rgba(224,123,57,0.25)" : "0 8px 28px rgba(44,80,58,0.14)"; }}
        onMouseOut={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = isBoosted ? "0 4px 20px rgba(224,123,57,0.18)" : "0 2px 12px rgba(44,80,58,0.07)"; }}>

        {isBoosted && (
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, background: "linear-gradient(90deg, #e07b39, #f5a623)", padding: "5px 12px", display: "flex", alignItems: "center", gap: 6, zIndex: 2 }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#fff" }}>🔥 TOP klinika</span>
            <span style={{ marginLeft: "auto", fontSize: "0.68rem", color: "rgba(255,255,255,0.8)" }}>Doporučeno</span>
          </div>
        )}

        <div style={{ height: isBoosted ? 140 : 160, marginTop: isBoosted ? 30 : 0, background: "linear-gradient(145deg, #e8f5ef, #f2faf6)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
          {k.foto_urls?.[0]
            ? <img src={k.foto_urls[0]} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <span style={{ fontSize: "4rem" }}>🩺</span>}
          {k.tier === "premium" && (
            <div style={{ position: "absolute", top: 10, left: 10, background: "#e07b39", color: "#fff", borderRadius: 20, padding: "3px 10px", fontSize: "0.72rem", fontWeight: 700 }}>⭐ Premium</div>
          )}
        </div>

        <div style={{ padding: "16px 18px 20px" }}>
          <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.1rem", color: "#1c2b22", marginBottom: 6 }}>{k.clinic_name}</h3>
          <div style={{ fontSize: "0.82rem", color: "#8a9e92", marginBottom: 10, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <span>📍 {k.city}</span>
            <span>📞 {k.phone}</span>
          </div>
          {k.specializations?.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
              {k.specializations.slice(0, 3).map(s => (
                <span key={s} style={{ background: "#e8f5ef", color: "#2d6a4f", borderRadius: 20, padding: "2px 9px", fontSize: "0.72rem", fontWeight: 600 }}>{s}</span>
              ))}
              {k.specializations.length > 3 && <span style={{ background: "#f7f4ef", color: "#8a9e92", borderRadius: 20, padding: "2px 9px", fontSize: "0.72rem" }}>+{k.specializations.length - 3}</span>}
            </div>
          )}
          <button style={{ width: "100%", background: isBoosted ? "#e07b39" : "#2d6a4f", color: "#fff", border: "none", borderRadius: 8, padding: "9px", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
            Zobrazit profil →
          </button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f7f4ef", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600;700&display=swap');`}</style>

      <nav style={{ background: "#fff", borderBottom: "1px solid #ede8e0", height: 64, display: "flex", alignItems: "center", padding: "0 32px", gap: 16, boxShadow: "0 1px 12px rgba(44,80,58,0.07)" }}>
        <button onClick={() => navigate("/")} style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer" }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: "#2d6a4f", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>🐾</div>
          <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.15rem", color: "#1c2b22" }}>Pet Market</span>
        </button>
        <span style={{ color: "#8a9e92", fontSize: "0.85rem" }}>/ Veterinární kliniky</span>
        <div style={{ marginLeft: "auto" }}>
          <button onClick={() => navigate("/veterinar/registrace")} style={{ background: "#2d6a4f", color: "#fff", border: "none", borderRadius: 10, padding: "9px 18px", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>+ Přidat kliniku</button>
        </div>
      </nav>

      <div style={{ background: "linear-gradient(135deg, #2d6a4f 0%, #3a7d60 100%)", padding: "40px 24px", textAlign: "center" }}>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(1.6rem, 3vw, 2.2rem)", color: "#fff", marginBottom: 8 }}>🩺 Veterinární kliniky</h1>
        <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.9rem", marginBottom: 24 }}>Najdi ověřenou veterinární kliniku ve svém okolí</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", maxWidth: 600, margin: "0 auto" }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Hledat kliniku nebo město..." style={{ ...inputStyle, flex: 1, minWidth: 200 }} />
          <select value={filterCity} onChange={e => setFilterCity(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
            <option value="">Všechna města</option>
            {cities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px", color: "#8a9e92" }}>Načítám...</div>
        ) : sorted.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px", color: "#8a9e92" }}>
            <div style={{ fontSize: "3rem", marginBottom: 16 }}>🩺</div>
            <p style={{ marginBottom: 20 }}>Zatím žádné kliniky. Buď první!</p>
            <button onClick={() => navigate("/veterinar/registrace")} style={{ background: "#2d6a4f", color: "#fff", border: "none", borderRadius: 10, padding: "12px 24px", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Zaregistrovat kliniku</button>
          </div>
        ) : (
          <>
            {boosted.length > 0 && (
              <div style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#e07b39", textTransform: "uppercase", letterSpacing: "0.05em" }}>🔥 Topované kliniky</span>
                <div style={{ flex: 1, height: 1, background: "#f5c99a" }} />
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
              {sorted.map(k => <KlinikaCard key={k.id} k={k} />)}
            </div>
          </>
        )}
      </div>

      {/* DETAIL MODAL */}
      {selected && (
        <div onClick={() => setSelected(null)} style={{ position: "fixed", inset: 0, background: "rgba(28,43,34,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(5px)" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 22, maxWidth: 560, width: "100%", maxHeight: "92vh", overflowY: "auto", boxShadow: "0 12px 40px rgba(44,80,58,0.14)" }}>
            <div style={{ height: 220, background: "linear-gradient(145deg, #e8f5ef, #f2faf6)", position: "relative", overflow: "hidden", borderRadius: "22px 22px 0 0" }}>
              {selected.foto_urls?.[0]
                ? <img src={selected.foto_urls[0]} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "5rem" }}>🩺</div>}
              {selected.tier === "premium" && <div style={{ position: "absolute", top: 14, left: 14, background: "#e07b39", color: "#fff", borderRadius: 20, padding: "4px 12px", fontSize: "0.8rem", fontWeight: 700 }}>⭐ Premium</div>}
              {selected.boosted_until && new Date(selected.boosted_until) > now && (
                <div style={{ position: "absolute", top: 14, right: 56, background: "linear-gradient(90deg, #e07b39, #f5a623)", color: "#fff", borderRadius: 20, padding: "4px 12px", fontSize: "0.8rem", fontWeight: 700 }}>🔥 TOP</div>
              )}
              <button onClick={() => setSelected(null)} style={{ position: "absolute", top: 14, right: 14, background: "rgba(255,255,255,0.9)", border: "none", borderRadius: "50%", width: 38, height: 38, cursor: "pointer", fontSize: "1.1rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            </div>
            <div style={{ padding: "24px 28px 28px" }}>
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.4rem", color: "#1c2b22", marginBottom: 6 }}>{selected.clinic_name}</h2>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
                {[`📍 ${selected.address}, ${selected.city}`, `📞 ${selected.phone}`, selected.web && `🌐 ${selected.web}`].filter(Boolean).map(tag => (
                  <span key={tag} style={{ background: "#f7f4ef", border: "1px solid #ede8e0", borderRadius: 20, padding: "4px 12px", fontSize: "0.78rem", color: "#4a5e52" }}>{tag}</span>
                ))}
              </div>
              {selected.description && <p style={{ color: "#4a5e52", fontSize: "0.9rem", lineHeight: 1.65, marginBottom: 18 }}>{selected.description}</p>}
              {selected.specializations?.length > 0 && (
                <div style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "#8a9e92", textTransform: "uppercase", marginBottom: 8 }}>Specializace</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {selected.specializations.map(s => <span key={s} style={{ background: "#e8f5ef", color: "#2d6a4f", borderRadius: 20, padding: "3px 10px", fontSize: "0.78rem", fontWeight: 600 }}>{s}</span>)}
                  </div>
                </div>
              )}
              {selected.opening_hours && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "#8a9e92", textTransform: "uppercase", marginBottom: 8 }}>Otevírací doba</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                    {Object.entries(selected.opening_hours).map(([den, h]) => (
                      <div key={den} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", color: h.closed ? "#b91c1c" : "#1c2b22", padding: "3px 0" }}>
                        <span style={{ fontWeight: 600 }}>{den}</span>
                        <span>{h.closed ? "Zavřeno" : `${h.open} – ${h.close}`}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {selected.metadata?.tym?.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "#8a9e92", textTransform: "uppercase", marginBottom: 8 }}>Náš tým</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {selected.metadata.tym.map((lekar, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "#f7f4ef", borderRadius: 10 }}>
                        <span style={{ fontSize: "1.2rem" }}>👨‍⚕️</span>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: "0.88rem", color: "#1c2b22" }}>{lekar.titul} {lekar.jmeno}</div>
                          {lekar.specializace && <div style={{ fontSize: "0.75rem", color: "#8a9e92" }}>{lekar.specializace}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {selected.foto_urls?.length > 1 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "#8a9e92", textTransform: "uppercase", marginBottom: 8 }}>Fotogalerie</div>
                  <div style={{ display: "flex", gap: 8, overflowX: "auto" }}>
                    {selected.foto_urls.map((url, i) => <img key={i} src={url} style={{ width: 90, height: 70, objectFit: "cover", borderRadius: 8, flexShrink: 0 }} />)}
                  </div>
                </div>
              )}
              <button onClick={() => selected.phone && window.open(`tel:${selected.phone}`)} style={{ width: "100%", background: "#2d6a4f", color: "#fff", border: "none", borderRadius: 10, padding: "13px", fontSize: "0.95rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>📞 Zavolat klinice</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}