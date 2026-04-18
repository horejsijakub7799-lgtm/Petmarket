import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabase";

export default function VenceniPage() {
  const navigate = useNavigate();
  const [vencitele, setVencitele] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCity, setFilterCity] = useState("");

  useEffect(() => { fetchVencitele(); }, []);

  const fetchVencitele = async () => {
    const { data } = await supabase
      .from("partner_profiles")
      .select("*")
      .eq("approved", true)
      .eq("type", "vencitel")
      .order("created_at", { ascending: false });
    if (data) setVencitele(data);
    setLoading(false);
  };

  const now = new Date();
  const cities = [...new Set(vencitele.map(v => v.city))].sort();
  const filtered = vencitele
    .filter(v => !filterCity || v.city === filterCity)
    .filter(v => !search || v.name.toLowerCase().includes(search.toLowerCase()) || v.city.toLowerCase().includes(search.toLowerCase()));

  const boosted = filtered.filter(v => v.boosted_until && new Date(v.boosted_until) > now);
  const normal = filtered.filter(v => !v.boosted_until || new Date(v.boosted_until) <= now);
  const sorted = [...boosted, ...normal];

  const inputStyle = { border: "1.5px solid #ede8e0", borderRadius: 30, padding: "10px 18px", fontSize: "0.9rem", outline: "none", fontFamily: "'DM Sans', sans-serif", background: "#fff", color: "#1c2b22" };

  const VencitelCard = ({ v }) => {
    const isBoosted = v.boosted_until && new Date(v.boosted_until) > now;
    return (
      <div onClick={() => navigate(`/partner/${v.id}`)}
        style={{ background: "#fff", borderRadius: 16, overflow: "hidden", border: isBoosted ? "2px solid #e07b39" : "1.5px solid #ede8e0", boxShadow: isBoosted ? "0 4px 20px rgba(224,123,57,0.18)" : "0 2px 12px rgba(44,80,58,0.07)", cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s", position: "relative" }}
        onMouseOver={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = isBoosted ? "0 8px 28px rgba(224,123,57,0.25)" : "0 8px 28px rgba(44,80,58,0.14)"; }}
        onMouseOut={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = isBoosted ? "0 4px 20px rgba(224,123,57,0.18)" : "0 2px 12px rgba(44,80,58,0.07)"; }}>

        {isBoosted && (
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, background: "linear-gradient(90deg, #e07b39, #f5a623)", padding: "5px 12px", display: "flex", alignItems: "center", gap: 6, zIndex: 2 }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#fff" }}>🔥 TOP venčitel</span>
            <span style={{ marginLeft: "auto", fontSize: "0.68rem", color: "rgba(255,255,255,0.8)" }}>Doporučeno</span>
          </div>
        )}

        <div style={{ height: isBoosted ? 140 : 160, marginTop: isBoosted ? 30 : 0, background: "linear-gradient(145deg, #e8f5ef, #f2faf6)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
          {v.foto_urls?.[0]
            ? <img src={v.foto_urls[0]} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <span style={{ fontSize: "4rem" }}>🦮</span>}
          {v.tier === "premium" && (
            <div style={{ position: "absolute", top: 10, left: 10, background: "#e07b39", color: "#fff", borderRadius: 20, padding: "3px 10px", fontSize: "0.72rem", fontWeight: 700 }}>⭐ Premium</div>
          )}
        </div>

        <div style={{ padding: "16px 18px 20px" }}>
          <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.1rem", color: "#1c2b22", marginBottom: 6 }}>{v.name}</h3>
          <div style={{ fontSize: "0.82rem", color: "#8a9e92", marginBottom: 10, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <span>📍 {v.city}</span>
            {v.metadata?.price_per_walk && <span>💰 {v.metadata.price_per_walk} Kč/procházka</span>}
            {v.metadata?.walk_duration_min && <span>⏱ {v.metadata.walk_duration_min} min</span>}
          </div>
          {v.metadata?.sluzby?.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
              {v.metadata.sluzby.slice(0, 3).map(s => (
                <span key={s} style={{ background: "#e8f5ef", color: "#2d6a4f", borderRadius: 20, padding: "2px 9px", fontSize: "0.72rem", fontWeight: 600 }}>{s}</span>
              ))}
              {v.metadata.sluzby.length > 3 && (
                <span style={{ background: "#f7f4ef", color: "#8a9e92", borderRadius: 20, padding: "2px 9px", fontSize: "0.72rem" }}>+{v.metadata.sluzby.length - 3}</span>
              )}
            </div>
          )}
          {v.metadata?.gps_tracking && (
            <div style={{ fontSize: "0.75rem", color: "#2d6a4f", fontWeight: 600, marginBottom: 10 }}>📍 GPS tracking</div>
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
        <span style={{ color: "#8a9e92", fontSize: "0.85rem" }}>/ Venčení psů</span>
        <div style={{ marginLeft: "auto" }}>
          <button onClick={() => navigate("/vencitel/registrace")} style={{ background: "#2d6a4f", color: "#fff", border: "none", borderRadius: 10, padding: "9px 18px", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>+ Přidat profil</button>
        </div>
      </nav>

      <div style={{ background: "linear-gradient(135deg, #2d6a4f 0%, #3a7d60 100%)", padding: "40px 24px", textAlign: "center" }}>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(1.6rem, 3vw, 2.2rem)", color: "#fff", marginBottom: 8 }}>🦮 Venčení psů</h1>
        <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.9rem", marginBottom: 24 }}>Najdi spolehlivého venčitele ve svém okolí</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", maxWidth: 600, margin: "0 auto" }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Hledat venčitele nebo město..." style={{ ...inputStyle, flex: 1, minWidth: 200 }} />
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
            <div style={{ fontSize: "3rem", marginBottom: 16 }}>🦮</div>
            <p style={{ marginBottom: 20 }}>Zatím žádní venčitelé. Buď první!</p>
            <button onClick={() => navigate("/vencitel/registrace")} style={{ background: "#2d6a4f", color: "#fff", border: "none", borderRadius: 10, padding: "12px 24px", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Zaregistrovat se</button>
          </div>
        ) : (
          <>
            {boosted.length > 0 && (
              <div style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#e07b39", textTransform: "uppercase", letterSpacing: "0.05em" }}>🔥 Topovaní venčitelé</span>
                <div style={{ flex: 1, height: 1, background: "#f5c99a" }} />
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
              {sorted.map(v => <VencitelCard key={v.id} v={v} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}