import { useNavigate } from "react-router-dom";

const PARTNERI = [
  {
    id: "veterinar",
    icon: "🩺",
    title: "Veterinární klinika",
    desc: "Zobrazujte svou kliniku na mapě, přijímejte dotazy od majitelů mazlíčků a budujte svou reputaci.",
    price: "od 499 Kč/měsíc",
    url: "/veterinar/registrace",
    available: true,
  },
  {
    id: "hotel",
    icon: "🏨",
    title: "Psí hotel",
    desc: "Nabídněte ubytování pro psy majitelům kteří odjíždí na dovolenou nebo služební cestu.",
    price: "od 399 Kč/měsíc",
    url: null,
    available: false,
  },
  {
    id: "venceni",
    icon: "🦮",
    title: "Venčitel psů",
    desc: "Nabídněte své služby venčení psů v okolí. Oslovte majitele kteří nemají čas.",
    price: "od 199 Kč/měsíc",
    url: null,
    available: false,
  },
  {
    id: "prodejce",
    icon: "🛍️",
    title: "Partnerský prodejce",
    desc: "Prodávejte své produkty pro mazlíčky tisícům zákazníků na Pet Market.",
    price: "od 299 Kč/měsíc",
    url: null,
    available: false,
  },
  {
    id: "pojistovna",
    icon: "🛡️",
    title: "Pojišťovna",
    desc: "Nabídněte pojištění mazlíčků přímo tam kde majitelé nakupují pro své mazlíčky.",
    price: "individuální cena",
    url: null,
    available: false,
  },
];

export default function PartneriPage() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: "100vh", background: "#f7f4ef", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600;700&display=swap');`}</style>

      <nav style={{ background: "#fff", borderBottom: "1px solid #ede8e0", height: 64, display: "flex", alignItems: "center", padding: "0 32px", boxShadow: "0 1px 12px rgba(44,80,58,0.07)" }}>
        <button onClick={() => navigate("/")} style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer" }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: "#2d6a4f", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>🐾</div>
          <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.15rem", color: "#1c2b22" }}>Pet Market</span>
        </button>
      </nav>

      {/* HERO */}
      <div style={{ background: "linear-gradient(135deg, #2d6a4f 0%, #3a7d60 100%)", padding: "60px 24px", textAlign: "center" }}>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(1.8rem, 4vw, 2.6rem)", color: "#fff", marginBottom: 16, letterSpacing: "-0.02em" }}>Staň se partnerem Pet Market</h1>
        <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "1rem", maxWidth: 520, margin: "0 auto", lineHeight: 1.7 }}>Oslovte tisíce majitelů mazlíčků kteří hledají právě vaše služby. Vyberte typ partnerství který vám nejlépe sedí.</p>
      </div>

      {/* KARTY */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "48px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20 }}>
          {PARTNERI.map(p => (
            <div key={p.id} style={{ background: "#fff", borderRadius: 18, padding: "28px 24px", border: `1.5px solid ${p.available ? "#b7d9c7" : "#ede8e0"}`, boxShadow: "0 2px 12px rgba(44,80,58,0.07)", display: "flex", flexDirection: "column", gap: 14, opacity: p.available ? 1 : 0.75 }}>
              <div style={{ fontSize: "2.5rem" }}>{p.icon}</div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.2rem", color: "#1c2b22", margin: 0 }}>{p.title}</h2>
                  {!p.available && <span style={{ background: "#f7f4ef", color: "#8a9e92", borderRadius: 20, padding: "2px 10px", fontSize: "0.68rem", fontWeight: 600, whiteSpace: "nowrap" }}>Brzy</span>}
                </div>
                <p style={{ color: "#4a5e52", fontSize: "0.88rem", lineHeight: 1.6, margin: 0 }}>{p.desc}</p>
              </div>
              <div style={{ marginTop: "auto" }}>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#2d6a4f", marginBottom: 12 }}>{p.price}</div>
                {p.available ? (
                  <button onClick={() => navigate(p.url)} style={{ width: "100%", background: "#2d6a4f", color: "#fff", border: "none", borderRadius: 10, padding: "12px", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Zaregistrovat se →</button>
                ) : (
                  <button disabled style={{ width: "100%", background: "#f7f4ef", color: "#8a9e92", border: "1.5px solid #ede8e0", borderRadius: 10, padding: "12px", fontSize: "0.9rem", fontWeight: 600, cursor: "not-allowed", fontFamily: "'DM Sans', sans-serif" }}>Připravujeme</button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* INFO SEKCE */}
        <div style={{ marginTop: 48, background: "#fff", borderRadius: 18, padding: "32px", border: "1px solid #ede8e0" }}>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.3rem", color: "#1c2b22", marginBottom: 20 }}>Jak to funguje?</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 20 }}>
            {[
              { icon: "📝", title: "1. Vyplníš formulář", desc: "Základní údaje o tvé firmě nebo službě." },
              { icon: "✅", title: "2. Ověříme tě", desc: "Do 24 hodin zkontrolujeme vaše IČO a schválíme profil." },
              { icon: "💳", title: "3. Zaplatíš", desc: "Jednoduchá platba kartou, měsíční předplatné." },
              { icon: "🚀", title: "4. Jsi live", desc: "Váš profil se okamžitě zobrazí tisícům zákazníků." },
            ].map(s => (
              <div key={s.title} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ fontSize: "1.8rem" }}>{s.icon}</div>
                <div style={{ fontWeight: 600, color: "#1c2b22", fontSize: "0.9rem" }}>{s.title}</div>
                <div style={{ color: "#4a5e52", fontSize: "0.82rem", lineHeight: 1.5 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}