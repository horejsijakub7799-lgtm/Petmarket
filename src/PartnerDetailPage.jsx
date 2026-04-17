import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "./supabase";

const TYPE_CONFIG = {
  hotel: { icon: "🏨", label: "Psí hotel", color: "#1a4fa0", light: "#e8eef8", cta: "Zavolat hotelu", ctaIcon: "📞" },
  vencitel: { icon: "🦮", label: "Venčitel psů", color: "#2d6a4f", light: "#e8f5ef", cta: "Kontaktovat venčitele", ctaIcon: "📞" },
  hlidani: { icon: "🏠", label: "Hlídání zvířat", color: "#7b3fa0", light: "#f3e8f8", cta: "Kontaktovat hlídače", ctaIcon: "📞" },
  veterinar: { icon: "🩺", label: "Veterinární klinika", color: "#b91c1c", light: "#fce4ec", cta: "Zavolat klinice", ctaIcon: "📞" },
  prodejce: { icon: "🛍️", label: "Partnerský prodejce", color: "#e07b39", light: "#fdf0e6", cta: "Kontaktovat prodejce", ctaIcon: "📞" },
};

export default function PartnerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [partner, setPartner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fotoIdx, setFotoIdx] = useState(0);

  useEffect(() => { fetchPartner(); }, [id]);

  const fetchPartner = async () => {
    // Zkus partner_profiles
    let { data } = await supabase.from("partner_profiles").select("*").eq("id", id).eq("approved", true).single();
    if (!data) {
      // Zkus vet_profiles
      const { data: vet } = await supabase.from("vet_profiles").select("*").eq("id", id).eq("approved", true).single();
      if (vet) data = { ...vet, type: "veterinar", name: vet.clinic_name };
    }
    setPartner(data);
    setLoading(false);
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif", background: "#f7f4ef" }}>
      <div style={{ textAlign: "center", color: "#8a9e92" }}>
        <div style={{ fontSize: "2rem", marginBottom: 12 }}>🐾</div>
        <p>Načítám profil...</p>
      </div>
    </div>
  );

  if (!partner) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif", background: "#f7f4ef" }}>
      <div style={{ textAlign: "center", color: "#8a9e92" }}>
        <div style={{ fontSize: "3rem", marginBottom: 12 }}>😕</div>
        <p style={{ marginBottom: 20 }}>Profil nenalezen.</p>
        <button onClick={() => navigate(-1)} style={{ background: "#2d6a4f", color: "#fff", border: "none", borderRadius: 10, padding: "12px 24px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>← Zpět</button>
      </div>
    </div>
  );

  const cfg = TYPE_CONFIG[partner.type] || TYPE_CONFIG.hotel;
  const fotos = partner.foto_urls || [];

  return (
    <div style={{ minHeight: "100vh", background: "#f7f4ef", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600;700&display=swap');`}</style>

      {/* NAV */}
      <nav style={{ background: "#fff", borderBottom: "1px solid #ede8e0", height: 64, display: "flex", alignItems: "center", padding: "0 32px", gap: 16, position: "sticky", top: 0, zIndex: 100, boxShadow: "0 1px 12px rgba(44,80,58,0.07)" }}>
        <button onClick={() => navigate(-1)} style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer" }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: "#2d6a4f", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>🐾</div>
          <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.15rem", color: "#1c2b22" }}>Pet Market</span>
        </button>
        <span style={{ color: "#8a9e92", fontSize: "0.85rem" }}>/ {cfg.label}</span>
        {partner.tier === "premium" && (
          <span style={{ background: "#fdf0e6", color: "#e07b39", border: "1px solid #f5c99a", borderRadius: 20, padding: "3px 12px", fontSize: "0.75rem", fontWeight: 700 }}>⭐ Premium</span>
        )}
      </nav>

      {/* HERO FOTKA */}
      <div style={{ position: "relative", height: 320, background: "linear-gradient(145deg, #e8f5ef, #f2faf6)", overflow: "hidden" }}>
        {fotos.length > 0 ? (
          <>
            <img src={fotos[fotoIdx]} alt={partner.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            {fotos.length > 1 && (
              <>
                <button onClick={() => setFotoIdx(i => (i - 1 + fotos.length) % fotos.length)} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.45)", border: "none", borderRadius: "50%", width: 40, height: 40, cursor: "pointer", fontSize: "1.3rem", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>
                <button onClick={() => setFotoIdx(i => (i + 1) % fotos.length)} style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.45)", border: "none", borderRadius: "50%", width: 40, height: 40, cursor: "pointer", fontSize: "1.3rem", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>›</button>
                <div style={{ position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 6 }}>
                  {fotos.map((_, i) => <div key={i} onClick={() => setFotoIdx(i)} style={{ width: i === fotoIdx ? 20 : 8, height: 8, borderRadius: 4, background: i === fotoIdx ? "#fff" : "rgba(255,255,255,0.5)", cursor: "pointer", transition: "width 0.2s" }} />)}
                </div>
              </>
            )}
          </>
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "6rem" }}>{cfg.icon}</div>
        )}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 60%)" }} />
        <div style={{ position: "absolute", bottom: 24, left: 32, right: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <span style={{ background: cfg.color, color: "#fff", borderRadius: 20, padding: "4px 12px", fontSize: "0.75rem", fontWeight: 700 }}>{cfg.icon} {cfg.label}</span>
          </div>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(1.4rem, 3vw, 2rem)", color: "#fff", margin: 0, textShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>{partner.name}</h1>
          <div style={{ color: "rgba(255,255,255,0.85)", fontSize: "0.9rem", marginTop: 4 }}>📍 {partner.address ? `${partner.address}, ` : ""}{partner.city}</div>
        </div>
      </div>

      {/* OBSAH */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24, alignItems: "start" }}>

          {/* LEVÝ SLOUPEC */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* O NÁS */}
            {partner.description && (
              <div style={{ background: "#fff", borderRadius: 16, padding: "24px 28px", border: "1px solid #ede8e0" }}>
                <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.2rem", color: "#1c2b22", marginBottom: 14 }}>O nás</h2>
                <p style={{ color: "#4a5e52", fontSize: "0.92rem", lineHeight: 1.7, margin: 0 }}>{partner.description}</p>
              </div>
            )}

            {/* SLUŽBY */}
            {partner.metadata?.sluzby?.length > 0 && (
              <div style={{ background: "#fff", borderRadius: 16, padding: "24px 28px", border: "1px solid #ede8e0" }}>
                <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.2rem", color: "#1c2b22", marginBottom: 14 }}>Nabízené služby</h2>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {partner.metadata.sluzby.map(s => (
                    <span key={s} style={{ background: cfg.light, color: cfg.color, border: `1px solid ${cfg.color}30`, borderRadius: 20, padding: "6px 14px", fontSize: "0.82rem", fontWeight: 600 }}>{s}</span>
                  ))}
                </div>
              </div>
            )}

            {/* SPECIALIZACE (veterináři) */}
            {partner.specializations?.length > 0 && (
              <div style={{ background: "#fff", borderRadius: 16, padding: "24px 28px", border: "1px solid #ede8e0" }}>
                <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.2rem", color: "#1c2b22", marginBottom: 14 }}>Specializace</h2>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {partner.specializations.map(s => (
                    <span key={s} style={{ background: "#fce4ec", color: "#b91c1c", border: "1px solid #f48fb130", borderRadius: 20, padding: "6px 14px", fontSize: "0.82rem", fontWeight: 600 }}>{s}</span>
                  ))}
                </div>
              </div>
            )}

            {/* ZVÍŘATA */}
            {partner.metadata?.zvirata?.length > 0 && (
              <div style={{ background: "#fff", borderRadius: 16, padding: "24px 28px", border: "1px solid #ede8e0" }}>
                <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.2rem", color: "#1c2b22", marginBottom: 14 }}>Přijímá zvířata</h2>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {partner.metadata.zvirata.map(s => (
                    <span key={s} style={{ background: "#f7f4ef", color: "#4a5e52", border: "1px solid #ede8e0", borderRadius: 20, padding: "6px 14px", fontSize: "0.82rem" }}>{s}</span>
                  ))}
                </div>
              </div>
            )}

            {/* OTEVÍRACÍ DOBA */}
            {partner.metadata?.opening_hours && (
              <div style={{ background: "#fff", borderRadius: 16, padding: "24px 28px", border: "1px solid #ede8e0" }}>
                <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.2rem", color: "#1c2b22", marginBottom: 14 }}>Otevírací doba</h2>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  {Object.entries(partner.metadata.opening_hours).map(([den, h]) => (
                    <div key={den} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", padding: "6px 10px", borderRadius: 8, background: h.closed ? "#fce4ec" : "#f7f4ef" }}>
                      <span style={{ fontWeight: 600, color: "#1c2b22" }}>{den}</span>
                      <span style={{ color: h.closed ? "#b91c1c" : "#4a5e52" }}>{h.closed ? "Zavřeno" : `${h.open} – ${h.close}`}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* FOTOGALERIE */}
            {fotos.length > 1 && (
              <div style={{ background: "#fff", borderRadius: 16, padding: "24px 28px", border: "1px solid #ede8e0" }}>
                <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.2rem", color: "#1c2b22", marginBottom: 14 }}>Fotogalerie</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 8 }}>
                  {fotos.map((url, i) => (
                    <div key={i} onClick={() => setFotoIdx(i)} style={{ aspectRatio: "1", borderRadius: 10, overflow: "hidden", cursor: "pointer", border: i === fotoIdx ? `2px solid ${cfg.color}` : "2px solid transparent", transition: "border 0.2s" }}>
                      <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* PRAVÝ SLOUPEC — kontakt */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16, position: "sticky", top: 80 }}>
            <div style={{ background: "#fff", borderRadius: 16, padding: "24px", border: "1px solid #ede8e0" }}>
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.1rem", color: "#1c2b22", marginBottom: 16 }}>Kontakt</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                {partner.phone && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "0.88rem", color: "#4a5e52" }}>
                    <span style={{ width: 32, height: 32, borderRadius: 8, background: cfg.light, display: "flex", alignItems: "center", justifyContent: "center" }}>📞</span>
                    {partner.phone}
                  </div>
                )}
                {partner.address && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "0.88rem", color: "#4a5e52" }}>
                    <span style={{ width: 32, height: 32, borderRadius: 8, background: cfg.light, display: "flex", alignItems: "center", justifyContent: "center" }}>📍</span>
                    {partner.address}, {partner.city}
                  </div>
                )}
                {partner.web && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "0.88rem", color: "#4a5e52" }}>
                    <span style={{ width: 32, height: 32, borderRadius: 8, background: cfg.light, display: "flex", alignItems: "center", justifyContent: "center" }}>🌐</span>
                    <a href={partner.web.startsWith("http") ? partner.web : `https://${partner.web}`} target="_blank" rel="noopener noreferrer" style={{ color: cfg.color, textDecoration: "none", fontWeight: 600 }}>{partner.web}</a>
                  </div>
                )}
                {partner.instagram && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "0.88rem", color: "#4a5e52" }}>
                    <span style={{ width: 32, height: 32, borderRadius: 8, background: cfg.light, display: "flex", alignItems: "center", justifyContent: "center" }}>📸</span>
                    <a href={`https://instagram.com/${partner.instagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer" style={{ color: cfg.color, textDecoration: "none", fontWeight: 600 }}>@{partner.instagram.replace("@", "")}</a>
                  </div>
                )}
              </div>
              {partner.phone && (
                <button onClick={() => window.open(`tel:${partner.phone}`)} style={{ width: "100%", background: cfg.color, color: "#fff", border: "none", borderRadius: 10, padding: "13px", fontSize: "0.95rem", fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", marginBottom: 10 }}>
                  {cfg.ctaIcon} {cfg.cta}
                </button>
              )}
              {partner.web && (
                <a href={partner.web.startsWith("http") ? partner.web : `https://${partner.web}`} target="_blank" rel="noopener noreferrer" style={{ display: "block", width: "100%", background: "#f7f4ef", color: cfg.color, border: `1.5px solid ${cfg.color}40`, borderRadius: 10, padding: "11px", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", textAlign: "center", textDecoration: "none", boxSizing: "border-box" }}>
                  🌐 Navštívit web
                </a>
              )}
            </div>

            {/* KAPACITA / CENY */}
            {(partner.metadata?.capacity || partner.metadata?.price_per_night || partner.metadata?.price_per_walk || partner.metadata?.price_per_day) && (
              <div style={{ background: "#fff", borderRadius: 16, padding: "20px 24px", border: "1px solid #ede8e0" }}>
                <h3 style={{ fontSize: "0.88rem", fontWeight: 700, color: "#1c2b22", marginBottom: 12 }}>Informace</h3>
                {partner.metadata?.capacity && <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "#4a5e52", padding: "6px 0", borderBottom: "1px solid #f7f4ef" }}><span>Kapacita</span><strong>{partner.metadata.capacity} psů</strong></div>}
                {partner.metadata?.price_per_night && <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "#4a5e52", padding: "6px 0", borderBottom: "1px solid #f7f4ef" }}><span>Cena za noc</span><strong style={{ color: cfg.color }}>{partner.metadata.price_per_night} Kč</strong></div>}
                {partner.metadata?.price_per_walk && <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "#4a5e52", padding: "6px 0", borderBottom: "1px solid #f7f4ef" }}><span>Cena za venčení</span><strong style={{ color: cfg.color }}>{partner.metadata.price_per_walk} Kč</strong></div>}
                {partner.metadata?.price_per_day && <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "#4a5e52", padding: "6px 0" }}><span>Cena za den</span><strong style={{ color: cfg.color }}>{partner.metadata.price_per_day} Kč</strong></div>}
              </div>
            )}

            <div style={{ background: "#e8f5ef", borderRadius: 12, padding: "14px 16px", fontSize: "0.78rem", color: "#2d6a4f", textAlign: "center" }}>
              ✓ Ověřený partner Pet Market
            </div>
          </div>
        </div>
      </div>

      <footer style={{ background: "#1c2b22", color: "rgba(255,255,255,0.5)", padding: "24px", textAlign: "center", fontSize: "0.8rem", marginTop: 32 }}>
        <span style={{ fontFamily: "'DM Serif Display', serif", color: "rgba(255,255,255,0.8)", fontSize: "1rem" }}>Pet Market</span>
        {" "}· Tržiště pro mazlíčky · Celá ČR · {new Date().getFullYear()}
      </footer>
    </div>
  );
}