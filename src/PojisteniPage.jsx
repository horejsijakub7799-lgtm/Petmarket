import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabase";
import { useAuth } from "./useAuth";

const POJISTOVNY = [
  {
    id: "kolonnade",
    name: "Kolonnade",
    logo: "🛡️",
    popis: "Největší specializovaná pojišťovna pro psy a kočky v ČR. Kryje veterinární náklady, operace i chronická onemocnění.",
    cena_od: "199 Kč/měsíc",
    hodnoceni: 4.7,
    vyhody: ["Veterinární náklady", "Operace a hospitalizace", "Chronická onemocnění", "Bez věkového omezení"],
    barva: "#1a4fa0",
    barva_light: "#e8eef8",
    url: "https://www.kolonnade.cz/pojisteni-zvirat",
    badge: "Nejoblíbenější",
  },
  {
    id: "halali",
    name: "Halali",
    logo: "🦮",
    popis: "Specializovaná pojišťovna pro domácí zvířata. Výhodné ceny a rychlé vyřízení pojistných událostí online.",
    cena_od: "149 Kč/měsíc",
    hodnoceni: 4.5,
    vyhody: ["Nízké ceny", "Online sjednání", "Rychlé vyřízení", "Psi, kočky i exotická zvířata"],
    barva: "#2d6a4f",
    barva_light: "#e8f5ef",
    url: "https://www.halali.cz",
    badge: "Nejlevnější",
  },
  {
    id: "direct",
    name: "Direct pojišťovna",
    logo: "⚡",
    popis: "100% online pojišťovna. Sjednání během 3 minut, okamžité potvrzení a správa pojistky přes app.",
    cena_od: "229 Kč/měsíc",
    hodnoceni: 4.4,
    vyhody: ["Sjednání online za 3 min", "Mobilní aplikace", "Okamžité potvrzení", "24/7 zákaznická linka"],
    barva: "#e07b39",
    barva_light: "#fdf0e6",
    url: "https://www.direct.cz",
    badge: "Nejrychlejší",
  },
  {
    id: "generali",
    name: "Generali",
    logo: "🏛️",
    popis: "Jeden z největších evropských pojistitelů. Komplexní krytí pro mazlíčky včetně odpovědnosti za škodu.",
    cena_od: "259 Kč/měsíc",
    hodnoceni: 4.3,
    vyhody: ["Komplexní krytí", "Odpovědnost za škodu", "Celoevropská platnost", "Prémiový servis"],
    barva: "#8b1a1a",
    barva_light: "#fdf0f0",
    url: "https://www.generali.cz",
    badge: "Nejkomplexnější",
  },
];

const FAQ = [
  { q: "Proč pojistit mazlíčka?", a: "Veterinární péče může být velmi nákladná. Operace může stát desítky tisíc korun. Pojištění kryje tyto náklady a vy se tak můžete soustředit na zdraví vašeho mazlíčka bez finančních starostí." },
  { q: "Od jakého věku lze zvíře pojistit?", a: "Většina pojišťoven přijímá zvířata od 8 týdnů věku. Horní věková hranice se liší — obvykle 8-10 let pro psy a kočky." },
  { q: "Co pojištění obvykle kryje?", a: "Veterinární náklady při nemoci nebo úrazu, operace, hospitalizaci, léky a někdy i preventivní péči. Rozsah se liší podle tarifu." },
  { q: "Jak rychle začíná pojištění platit?", a: "Obvykle platí čekací doba 14-30 dní od sjednání pojistky. Úrazy jsou většinou kryty ihned." },
];

export default function PojisteniPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [openFaq, setOpenFaq] = useState(null);
  const [kliknuto, setKliknuto] = useState({});

  useEffect(() => {
    setKliknuto({});
  }, []);

  const handleKlik = async (pojistovna) => {
    await supabase.from("affiliate_clicks").insert({
      pojistovna: pojistovna.id,
      user_id: user?.id || null,
      page: "pojisteni",
    });

    setKliknuto(prev => ({ ...prev, [pojistovna.id]: true }));

    if (pojistovna.url) {
      window.location.href = pojistovna.url;
    } else {
      window.location.href = `https://www.google.com/search?q=${encodeURIComponent(pojistovna.name + " pojištění mazlíčků")}`;
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f7f4ef", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600;700&display=swap');`}</style>

      <nav style={{ background: "#fff", borderBottom: "1px solid #ede8e0", height: 64, display: "flex", alignItems: "center", padding: "0 32px", gap: 16, boxShadow: "0 1px 12px rgba(44,80,58,0.07)" }}>
        <button onClick={() => navigate("/")} style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer" }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: "#2d6a4f", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>🐾</div>
          <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.15rem", color: "#1c2b22" }}>Pet Market</span>
        </button>
        <span style={{ color: "#8a9e92", fontSize: "0.85rem" }}>/ Pojištění mazlíčků</span>
      </nav>

      <div style={{ background: "linear-gradient(135deg, #2d6a4f 0%, #3a7d60 100%)", padding: "48px 24px", textAlign: "center" }}>
        <div style={{ fontSize: "3rem", marginBottom: 16 }}>🛡️</div>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(1.8rem, 3vw, 2.4rem)", color: "#fff", marginBottom: 12 }}>
          Pojištění mazlíčků
        </h1>
        <p style={{ color: "rgba(255,255,255,0.82)", fontSize: "1rem", maxWidth: 520, margin: "0 auto 24px" }}>
          Srovnej pojišťovny a vyber tu nejlepší ochranu pro svého mazlíčka. Veterinární péče může přijít draho — buď připraven.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          {[["🏥", "Krytí vet. nákladů"], ["⚡", "Sjednání online"], ["🐾", "Psi i kočky"]].map(([icon, label]) => (
            <div key={label} style={{ background: "rgba(255,255,255,0.15)", borderRadius: 20, padding: "6px 16px", color: "#fff", fontSize: "0.82rem", fontWeight: 600 }}>{icon} {label}</div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20, marginBottom: 48 }}>
          {POJISTOVNY.map((p) => (
            <div key={p.id} style={{ background: "#fff", borderRadius: 20, border: "1.5px solid #ede8e0", boxShadow: "0 2px 12px rgba(44,80,58,0.07)", overflow: "hidden" }}>
              <div style={{ display: "flex", gap: 0, flexWrap: "wrap" }}>
                <div style={{ flex: 1, padding: "24px 28px", minWidth: 280 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
                    <div style={{ width: 52, height: 52, borderRadius: 14, background: p.barva_light, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.6rem", flexShrink: 0 }}>{p.logo}</div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.2rem", color: "#1c2b22", margin: 0 }}>{p.name}</h2>
                        {p.badge && <span style={{ background: p.barva_light, color: p.barva, fontSize: "0.68rem", fontWeight: 700, padding: "2px 8px", borderRadius: 20, border: `1px solid ${p.barva}30` }}>{p.badge}</span>}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 3 }}>
                        {"★★★★★".split("").map((s, i) => (
                          <span key={i} style={{ color: i < Math.floor(p.hodnoceni) ? "#e07b39" : "#ede8e0", fontSize: "0.85rem" }}>★</span>
                        ))}
                        <span style={{ fontSize: "0.78rem", color: "#8a9e92", marginLeft: 4 }}>{p.hodnoceni}</span>
                      </div>
                    </div>
                  </div>
                  <p style={{ color: "#4a5e52", fontSize: "0.88rem", lineHeight: 1.65, marginBottom: 16 }}>{p.popis}</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {p.vyhody.map(v => (
                      <span key={v} style={{ background: "#f7f4ef", border: "1px solid #ede8e0", borderRadius: 20, padding: "3px 10px", fontSize: "0.75rem", color: "#4a5e52", display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ color: "#2d6a4f", fontWeight: 700 }}>✓</span> {v}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ width: 200, background: p.barva_light, padding: "24px 20px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, flexShrink: 0 }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "0.72rem", fontWeight: 600, color: p.barva, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Cena od</div>
                    <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.4rem", fontWeight: 700, color: p.barva }}>{p.cena_od}</div>
                  </div>
                  <button
                    onClick={() => handleKlik(p)}
                    style={{ width: "100%", background: kliknuto[p.id] ? "#1b5e20" : p.barva, color: "#fff", border: "none", borderRadius: 12, padding: "12px 16px", fontSize: "0.88rem", fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "background 0.2s" }}>
                    {kliknuto[p.id] ? "✓ Přesměrování..." : "Zjistit cenu →"}
                  </button>
                  <div style={{ fontSize: "0.68rem", color: p.barva, opacity: 0.7, textAlign: "center" }}>
                    Přejdeš na web pojišťovny
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ background: "#fff", borderRadius: 20, border: "1.5px solid #ede8e0", padding: "32px", marginBottom: 48 }}>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.4rem", color: "#1c2b22", marginBottom: 24 }}>Časté otázky</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {FAQ.map((item, i) => (
              <div key={i} style={{ border: "1px solid #ede8e0", borderRadius: 12, overflow: "hidden" }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{ width: "100%", padding: "16px 20px", background: openFaq === i ? "#e8f5ef" : "#fff", border: "none", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: "'DM Sans', sans-serif", fontSize: "0.92rem", fontWeight: 600, color: "#1c2b22", textAlign: "left" }}>
                  {item.q}
                  <span style={{ color: "#2d6a4f", fontSize: "1.2rem", flexShrink: 0, marginLeft: 12 }}>{openFaq === i ? "−" : "+"}</span>
                </button>
                {openFaq === i && (
                  <div style={{ padding: "0 20px 16px", fontSize: "0.88rem", color: "#4a5e52", lineHeight: 1.7 }}>{item.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: "linear-gradient(135deg, #2d6a4f, #3a7d60)", borderRadius: 20, padding: "32px", textAlign: "center" }}>
          <div style={{ fontSize: "2rem", marginBottom: 12 }}>🐾</div>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.3rem", color: "#fff", marginBottom: 8 }}>Jsi veterinář nebo pet hotel?</h2>
          <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.9rem", marginBottom: 20 }}>Zaregistruj se jako partner a získej viditelnost na Pet Market.</p>
          <button onClick={() => navigate("/partneri")} style={{ background: "#fff", color: "#2d6a4f", border: "none", borderRadius: 12, padding: "12px 28px", fontSize: "0.95rem", fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
            Stát se partnerem →
          </button>
        </div>
      </div>

      <footer style={{ background: "#1c2b22", color: "rgba(255,255,255,0.5)", padding: "24px", textAlign: "center", fontSize: "0.8rem" }}>
        <span style={{ fontFamily: "'DM Serif Display', serif", color: "rgba(255,255,255,0.8)", fontSize: "1rem" }}>Pet Market</span>
        {" "}· Tržiště pro mazlíčky · Celá ČR · {new Date().getFullYear()}
      </footer>
    </div>
  );
}