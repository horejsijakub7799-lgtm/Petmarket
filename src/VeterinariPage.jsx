import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabase";

export default function VeterinariPage() {
  const navigate = useNavigate();
  const [kliniky, setKliniky] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [view, setView] = useState("list"); // "list" nebo "map"
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => { fetchKliniky(); }, []);

  useEffect(() => {
    // Načti Leaflet dynamicky
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
    if (!document.getElementById("leaflet-js")) {
      const script = document.createElement("script");
      script.id = "leaflet-js";
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = () => { if (view === "map") initMap(); };
      document.head.appendChild(script);
    }
  }, []);

  useEffect(() => {
    if (view === "map" && !mapInstanceRef.current && window.L) {
      initMap();
    } else if (view === "map" && !mapInstanceRef.current && !window.L) {
      // Leaflet ještě nenačten, počkej
      const interval = setInterval(() => {
        if (window.L) { clearInterval(interval); initMap(); }
      }, 100);
    }
  }, [view]);

  useEffect(() => {
    if (view === "map" && mapInstanceRef.current) {
      updateMarkers();
    }
  }, [kliniky, search, filterCity, view]);

  const fetchKliniky = async () => {
    const { data } = await supabase.from("vet_profiles").select("*").eq("approved", true).order("created_at", { ascending: false });
    if (data) setKliniky(data);
    setLoading(false);
  };

  const initMap = () => {
    if (!window.L || !mapRef.current) return;
    const map = window.L.map(mapRef.current).setView([49.8, 15.5], 7);
    window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    mapInstanceRef.current = map;
    updateMarkers();
  };

  const updateMarkers = () => {
    if (!mapInstanceRef.current) return;
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const filtered = getFiltered();
    filtered.forEach(k => {
      if (!k.lat || !k.lng) return;
      const isBoosted = k.boosted_until && new Date(k.boosted_until) > new Date();
      const icon = window.L.divIcon({
        className: "",
        html: `<div style="background:${isBoosted ? "#e07b39" : "#2d6a4f"};color:#fff;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-size:1.1rem;box-shadow:0 2px 8px rgba(0,0,0,0.3);border:2px solid #fff;">🩺</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });
      const marker = window.L.marker([k.lat, k.lng], { icon }).addTo(mapInstanceRef.current);
      marker.bindPopup(`
        <div style="font-family:'DM Sans',sans-serif;min-width:200px;">
          <div style="font-weight:700;font-size:0.95rem;margin-bottom:4px;">${k.clinic_name}</div>
          <div style="font-size:0.78rem;color:#8a9e92;margin-bottom:8px;">📍 ${k.address || ""}, ${k.city}</div>
          <div style="font-size:0.78rem;color:#4a5e52;margin-bottom:8px;">📞 ${k.phone || "—"}</div>
          <a href="/partner/${k.id}" style="display:block;background:#2d6a4f;color:#fff;border-radius:8px;padding:7px;text-align:center;font-size:0.82rem;font-weight:600;text-decoration:none;">Zobrazit profil →</a>
        </div>
      `);
      markersRef.current.push(marker);
    });
  };

  const getFiltered = () => {
    const now = new Date();
    const filtered = kliniky
      .filter(k => !filterCity || k.city === filterCity)
      .filter(k => !search || k.clinic_name.toLowerCase().includes(search.toLowerCase()) || k.city.toLowerCase().includes(search.toLowerCase()));
    const boosted = filtered.filter(k => k.boosted_until && new Date(k.boosted_until) > now);
    const normal = filtered.filter(k => !k.boosted_until || new Date(k.boosted_until) <= now);
    return [...boosted, ...normal];
  };

  const now = new Date();
  const cities = [...new Set(kliniky.map(k => k.city))].sort();
  const sorted = getFiltered();

  const inputStyle = { border: "1.5px solid #ede8e0", borderRadius: 30, padding: "10px 18px", fontSize: "0.9rem", outline: "none", fontFamily: "'DM Sans', sans-serif", background: "#fff", color: "#1c2b22" };

  const KlinikaCard = ({ k }) => {
    const isBoosted = k.boosted_until && new Date(k.boosted_until) > now;
    return (
      <div onClick={() => navigate(`/partner/${k.id}`)}
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
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        .leaflet-popup-content-wrapper { border-radius: 12px !important; box-shadow: 0 4px 20px rgba(0,0,0,0.15) !important; }
        .leaflet-popup-content { margin: 14px 16px !important; }
      `}</style>
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
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", maxWidth: 600, margin: "0 auto 16px" }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Hledat kliniku nebo město..." style={{ ...inputStyle, flex: 1, minWidth: 200 }} />
          <select value={filterCity} onChange={e => setFilterCity(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
            <option value="">Všechna města</option>
            {cities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        {/* Přepínač seznam/mapa */}
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
            {sorted.filter(k => !k.lat).length > 0 && (
              <div style={{ background: "#fff8e1", padding: "12px 20px", fontSize: "0.82rem", color: "#7a5c00", borderTop: "1px solid #f5c99a" }}>
                ⚠️ Některé kliniky nemají GPS souřadnice a nezobrazují se na mapě. Kliniky je mohou doplnit v dashboardu.
              </div>
            )}
          </div>
        ) : sorted.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px", color: "#8a9e92" }}>
            <div style={{ fontSize: "3rem", marginBottom: 16 }}>🩺</div>
            <p>Žádné kliniky nenalezeny.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
            {sorted.map(k => <KlinikaCard key={k.id} k={k} />)}
          </div>
        )}
      </div>
    </div>
  );
}