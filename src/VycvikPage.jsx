import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabase";

const TYPY_VYCVIKU = ["Základní poslušnost", "Agility", "Obrana", "Socializace štěňat", "Klikr trénink", "Záchranářský výcvik", "Sportovní kynologie", "Dog dancing"];

export default function VycvikPage() {
  const navigate = useNavigate();
  const [cvicaci, setCvicaci] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [filterType, setFilterType] = useState("");
  const [view, setView] = useState("list");
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const circlesRef = useRef([]);

  useEffect(() => { fetchCvicaci(); }, []);

  useEffect(() => {
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link"); link.id = "leaflet-css"; link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"; document.head.appendChild(link);
    }
    if (!document.getElementById("leaflet-js")) {
      const script = document.createElement("script"); script.id = "leaflet-js";
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"; document.head.appendChild(script);
    }
  }, []);

  useEffect(() => {
    if (view === "map") {
      if (window.L && !mapInstanceRef.current) initMap();
      else if (!window.L) { const i = setInterval(() => { if (window.L) { clearInterval(i); initMap(); } }, 100); }
    }
  }, [view]);

  useEffect(() => { if (view === "map" && mapInstanceRef.current) updateMarkers(); }, [cvicaci, search, filterCity, filterType, view]);

  const initMap = () => {
    if (!window.L || !mapRef.current) return;
    const map = window.L.map(mapRef.current).setView([49.8, 15.5], 7);
    window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap contributors" }).addTo(map);
    mapInstanceRef.current = map; updateMarkers();
  };

  const updateMarkers = () => {
    if (!mapInstanceRef.current) return;
    markersRef.current.forEach(m => m.remove()); markersRef.current = [];
    circlesRef.current.forEach(c => c.remove()); circlesRef.current = [];
    sorted.forEach(v => {
      if (!v.lat || !v.lng) return;
      const isBoosted = v.boosted_until && new Date(v.boosted_until) > new Date();
      const color = isBoosted ? "#e07b39" : "#2d6a4f";

      // Kruh spádové oblasti
      if (v.metadata?.area_radius_km) {
        const circle = window.L.circle([v.lat, v.lng], {
          radius: v.metadata.area_radius_km * 1000,
          color: color,
          fillColor: color,
          fillOpacity: 0.08,
          weight: 1.5,
          opacity: 0.5,
        }).addTo(mapInstanceRef.current);
        circlesRef.current.push(circle);
      }

      // Pin
      const icon = window.L.divIcon({ className: "", html: `<div style="background:${color};color:#fff;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-size:1.1rem;box-shadow:0 2px 8px rgba(0,0,0,0.3);border:2px solid #fff;">🎓</div>`, iconSize: [36, 36], iconAnchor: [18, 18] });
      const marker = window.L.marker([v.lat, v.lng], { icon }).addTo(mapInstanceRef.current);

      let priceStr = "";
      if (v.metadata?.price_individual) priceStr += `🎯 ${v.metadata.price_individual} Kč/ind.`;
      else if (v.metadata?.price_group) priceStr += `👥 ${v.metadata.price_group} Kč/skup.`;
      else if (v.metadata?.kurz_price) priceStr += `📚 ${v.metadata.kurz_price} Kč/kurz`;

      const radiusStr = v.metadata?.area_radius_km ? `📍 Spádová oblast: ${v.metadata.area_radius_km} km` : "";

      marker.bindPopup(`<div style="font-family:'DM Sans',sans-serif;min-width:220px;"><div style="font-weight:700;font-size:0.95rem;margin-bottom:4px;">${v.name}</div><div style="font-size:0.78rem;color:#8a9e92;margin-bottom:4px;">📍 ${v.city}</div>${priceStr ? `<div style="font-size:0.82rem;color:#2d6a4f;font-weight:700;margin-bottom:4px;">${priceStr}</div>` : ""}${radiusStr ? `<div style="font-size:0.72rem;color:#8a9e92;margin-bottom:8px;">${radiusStr}</div>` : ""}<a href="/partner/${v.id}" style="display:block;background:#2d6a4f;color:#fff;border-radius:8px;padding:7px;text-align:center;font-size:0.82rem;font-weight:600;text-decoration:none;">Zobrazit profil →</a></div>`);
      markersRef.current.push(marker);
    });
  };

  const fetchCvicaci = async () => {
    const { data } = await supabase
      .from("partner_profiles")
      .select("*")
      .eq("approved", true)
      .eq("type", "vycvik")
      .order("created_at", { ascending: false });
    if (data) setCvicaci(data);
    setLoading(false);
  };

  const now = new Date();
  const cities = [...new Set(cvicaci.map(v => v.city))].sort();
  const filtered = cvicaci
    .filter(v => !filterCity || v.city === filterCity)
    .filter(v => !filterType || (v.metadata?.typy_vycviku || []).includes(filterType))
    .filter(v => !search || v.name.toLowerCase().includes(search.toLowerCase()) || v.city.toLowerCase().includes(search.toLowerCase()));

  const boosted = filtered.filter(v => v.boosted_until && new Date(v.boosted_until) > now);
  const normal = filtered.filter(v => !v.boosted_until || new Date(v.boosted_until) <= now);
  const sorted = [...boosted, ...normal];

  const inputStyle = { border: "1.5px solid #ede8e0", borderRadius: 30, padding: "10px 18px", fontSize: "0.9rem", outline: "none", fontFamily: "'DM Sans', sans-serif", background: "#fff", color: "#1c2b22" };

  const CvicakCard = ({ v }) => {
    const isBoosted = v.boosted_until && new Date(v.boosted_until) > now;
    const hasAnyPrice = v.metadata?.price_individual || v.metadata?.price_group || v.metadata?.kurz_price;

    return (
      <div onClick={() => navigate(`/partner/${v.id}`)}
        style={{ background: "#fff", borderRadius: 16, overflow: "hidden", border: isBoosted ? "2px solid #e07b39" : "1.5px solid #ede8e0", boxShadow: isBoosted ? "0 4px 20px rgba(224,123,57,0.18)" : "0 2px 12px rgba(44,80,58,0.07)", cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s", position: "relative" }}
        onMouseOver={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = isBoosted ? "0 8px 28px rgba(224,123,57,0.25)" : "0 8px 28px rgba(44,80,58,0.14)"; }}
        onMouseOut={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = isBoosted ? "0 4px 20px rgba(224,123,57,0.18)" : "0 2px 12px rgba(44,80,58,0.07)"; }}>

        {isBoosted && (
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, background: "linear-gradient(90deg, #e07b39, #f5a623)", padding: "5px 12px", display: "flex", alignItems: "center", gap: 6, zIndex: 2 }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#fff" }}>🔥 TOP cvičák</span>
            <span style={{ marginLeft: "auto", fontSize: "0.68rem", color: "rgba(255,255,255,0.8)" }}>Doporučeno</span>
          </div>
        )}

        <div style={{ height: isBoosted ? 140 : 160, marginTop: isBoosted ? 30 : 0, background: "linear-gradient(145deg, #e8f5ef, #f2faf6)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
          {v.foto_urls?.[0]
            ? <img src={v.foto_urls[0]} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <span style={{ fontSize: "4rem" }}>🎓</span>}
          {v.tier === "premium" && (
            <div style={{ position: "absolute", top: 10, left: 10, background: "#e07b39", color: "#fff", borderRadius: 20, padding: "3px 10px", fontSize: "0.72rem", fontWeight: 700 }}>⭐ Premium</div>
          )}
        </div>

        <div style={{ padding: "16px 18px 20px" }}>
          <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.1rem", color: "#1c2b22", marginBottom: 6 }}>{v.name}</h3>
          <div style={{ fontSize: "0.82rem", color: "#8a9e92", marginBottom: 10, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <span>📍 {v.city}</span>
            {v.metadata?.area_radius_km && <span>🗺 {v.metadata.area_radius_km} km</span>}
          </div>

          {/* Ceník náhled */}
          {hasAnyPrice && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
              {v.metadata?.price_individual && (
                <span style={{ background: "#e8f5ef", color: "#2d6a4f", borderRadius: 8, padding: "3px 8px", fontSize: "0.72rem", fontWeight: 600 }}>🎯 {v.metadata.price_individual} Kč</span>
              )}
              {v.metadata?.price_group && (
                <span style={{ background: "#e8f5ef", color: "#2d6a4f", borderRadius: 8, padding: "3px 8px", fontSize: "0.72rem", fontWeight: 600 }}>👥 {v.metadata.price_group} Kč</span>
              )}
              {v.metadata?.kurz_price && (
                <span style={{ background: "#e8f5ef", color: "#2d6a4f", borderRadius: 8, padding: "3px 8px", fontSize: "0.72rem", fontWeight: 600 }}>📚 {v.metadata.kurz_price} Kč</span>
              )}
            </div>
          )}

          {/* Typy výcviku */}
          {v.metadata?.typy_vycviku?.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
              {v.metadata.typy_vycviku.slice(0, 3).map(s => (
                <span key={s} style={{ background: "#f7f4ef", color: "#4a5e52", borderRadius: 20, padding: "2px 9px", fontSize: "0.72rem", fontWeight: 600 }}>{s}</span>
              ))}
              {v.metadata.typy_vycviku.length > 3 && (
                <span style={{ background: "#f7f4ef", color: "#8a9e92", borderRadius: 20, padding: "2px 9px", fontSize: "0.72rem" }}>+{v.metadata.typy_vycviku.length - 3}</span>
              )}
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
        <span style={{ color: "#8a9e92", fontSize: "0.85rem" }}>/ Výcvik psů</span>
        <div style={{ marginLeft: "auto" }}>
          <button onClick={() => navigate("/vycvik/registrace")} style={{ background: "#2d6a4f", color: "#fff", border: "none", borderRadius: 10, padding: "9px 18px", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>+ Přidat cvičák</button>
        </div>
      </nav>

      <div style={{ background: "linear-gradient(135deg, #2d6a4f 0%, #3a7d60 100%)", padding: "40px 24px", textAlign: "center" }}>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(1.6rem, 3vw, 2.2rem)", color: "#fff", marginBottom: 8 }}>🎓 Výcvik psů</h1>
        <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.9rem", marginBottom: 24 }}>Najdi cvičák nebo trenéra ve svém okolí</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", maxWidth: 720, margin: "0 auto 16px" }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Hledat cvičák nebo město..." style={{ ...inputStyle, flex: 1, minWidth: 200 }} />
          <select value={filterCity} onChange={e => setFilterCity(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
            <option value="">Všechna města</option>
            {cities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
            <option value="">Všechny typy výcviku</option>
            {TYPY_VYCVIKU.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div style={{ display: "inline-flex", background: "rgba(255,255,255,0.15)", borderRadius: 30, padding: 4, gap: 4 }}>
          {[{ id: "list", label: "☰ Seznam" }, { id: "map", label: "🗺️ Mapa" }].map(v => (
            <button key={v.id} onClick={() => setView(v.id)} style={{ padding: "7px 20px", borderRadius: 26, border: "none", background: view === v.id ? "#fff" : "transparent", color: view === v.id ? "#2d6a4f" : "rgba(255,255,255,0.85)", fontWeight: view === v.id ? 700 : 500, fontSize: "0.85rem", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s" }}>{v.label}</button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px", color: "#8a9e92" }}>Načítám...</div>
        ) : view === "map" ? (
          <div style={{ borderRadius: 16, overflow: "hidden", boxShadow: "0 4px 20px rgba(44,80,58,0.1)", border: "1px solid #ede8e0" }}>
            <div ref={mapRef} style={{ height: 560, width: "100%" }} />
          </div>
        ) : sorted.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px", color: "#8a9e92" }}>
            <div style={{ fontSize: "3rem", marginBottom: 16 }}>🎓</div>
            <p style={{ marginBottom: 20 }}>Zatím žádné cvičáky. Buď první!</p>
            <button onClick={() => navigate("/vycvik/registrace")} style={{ background: "#2d6a4f", color: "#fff", border: "none", borderRadius: 10, padding: "12px 24px", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Zaregistrovat se</button>
          </div>
        ) : (
          <>
            {boosted.length > 0 && (
              <div style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#e07b39", textTransform: "uppercase", letterSpacing: "0.05em" }}>🔥 Topované cvičáky</span>
                <div style={{ flex: 1, height: 1, background: "#f5c99a" }} />
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
              {sorted.map(v => <CvicakCard key={v.id} v={v} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}