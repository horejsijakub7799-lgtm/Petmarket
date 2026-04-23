import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "./supabase";

const CATEGORIES = [
  { id: "vse", label: "Všechny", icon: "🐾" },
  { id: "psi", label: "Psi", icon: "🐕" },
  { id: "kocky", label: "Kočky", icon: "🐈" },
  { id: "mali-mazlicci", label: "Malí mazlíčci", icon: "🐹" },
  { id: "zdravi", label: "Zdraví & veterinář", icon: "💊" },
  { id: "vycvik", label: "Výcvik", icon: "🎓" },
  { id: "krmeni", label: "Krmení & výživa", icon: "🦴" },
  { id: "recenze", label: "Recenze & testy", icon: "🛍️" },
];

export default function RadyPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const activeCategory = searchParams.get("kategorie") || "vse";

  useEffect(() => {
    document.title = "Rady pro majitele mazlíčků — Pet Market";
    const metaDesc = document.querySelector('meta[name="description"]');
    const desc = "Praktické rady, tipy a návody pro majitele psů, koček a dalších mazlíčků. Péče, výcvik, zdraví, krmení a recenze.";
    if (metaDesc) metaDesc.setAttribute("content", desc);
    else {
      const m = document.createElement("meta");
      m.name = "description";
      m.content = desc;
      document.head.appendChild(m);
    }
  }, []);

  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      let query = supabase
        .from("articles")
        .select("*")
        .eq("published", true)
        .order("published_at", { ascending: false });

      if (activeCategory !== "vse") {
        query = query.eq("category", activeCategory);
      }

      const { data, error } = await query;
      if (!error) setArticles(data || []);
      setLoading(false);
    };
    fetchArticles();
  }, [activeCategory]);

  const handleCategoryClick = (catId) => {
    if (catId === "vse") setSearchParams({});
    else setSearchParams({ kategorie: catId });
  };

  const getCatConfig = (id) => CATEGORIES.find(c => c.id === id) || CATEGORIES[0];

  return (
    <div style={{ minHeight: "100vh", background: "#f7f4ef", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600;700&display=swap');`}</style>

      {/* Nav */}
      <nav style={{ background: "#fff", borderBottom: "1px solid #ede8e0", height: 64, display: "flex", alignItems: "center", padding: "0 32px", gap: 16, position: "sticky", top: 0, zIndex: 100, boxShadow: "0 1px 12px rgba(44,80,58,0.07)" }}>
        <button onClick={() => navigate("/")} style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer" }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: "#2d6a4f", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>🐾</div>
          <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.15rem", color: "#1c2b22" }}>Pet Market</span>
        </button>
        <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
          <button onClick={() => navigate("/")} style={{ background: "#fff", color: "#2d6a4f", border: "2px solid #2d6a4f", borderRadius: 10, padding: "8px 18px", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>← Bazar</button>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg, #2d6a4f 0%, #3a7d60 100%)", padding: "40px 24px 32px", textAlign: "center" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", color: "#fff", fontSize: "clamp(1.6rem, 3.2vw, 2.4rem)", marginBottom: 12, letterSpacing: "-0.02em" }}>
            📖 Rady pro majitele mazlíčků
          </h1>
          <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.95rem", lineHeight: 1.6 }}>
            Praktické tipy, návody a inspirace pro tvého parťáka. Péče, výcvik, zdraví, výživa.
          </p>
        </div>
      </div>

      {/* Category filters */}
      <div style={{ background: "#fff", borderBottom: "1px solid #ede8e0", padding: "16px 24px", position: "sticky", top: 64, zIndex: 50 }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.id)}
              style={{
                padding: "8px 16px",
                borderRadius: 30,
                border: `1.5px solid ${activeCategory === cat.id ? "#2d6a4f" : "#ede8e0"}`,
                background: activeCategory === cat.id ? "#2d6a4f" : "#fff",
                color: activeCategory === cat.id ? "#fff" : "#4a5e52",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span>{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Articles grid */}
      <main style={{ maxWidth: 1180, margin: "0 auto", padding: "32px 24px 60px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px", color: "#8a9e92" }}>Načítám články...</div>
        ) : articles.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#8a9e92" }}>
            <div style={{ fontSize: "3rem", marginBottom: 16 }}>📝</div>
            <h3 style={{ fontFamily: "'DM Serif Display', serif", color: "#4a5e52", marginBottom: 8 }}>Zatím žádné články</h3>
            <p style={{ fontSize: "0.9rem" }}>
              {activeCategory === "vse"
                ? "Brzy tu najdeš užitečné rady a tipy. Stay tuned!"
                : "V této kategorii zatím nejsou žádné články. Zkus jinou kategorii."}
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 24 }}>
            {articles.map(article => {
              const cat = getCatConfig(article.category);
              return (
                <div
                  key={article.id}
                  onClick={() => navigate(`/rady/${article.slug}`)}
                  style={{
                    background: "#fff",
                    borderRadius: 16,
                    border: "1.5px solid #ede8e0",
                    overflow: "hidden",
                    cursor: "pointer",
                    transition: "transform 0.2s, box-shadow 0.2s",
                    boxShadow: "0 1px 4px rgba(44,80,58,0.07)",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(44,80,58,0.14)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 1px 4px rgba(44,80,58,0.07)"; }}
                >
                  <div style={{ height: 180, background: "linear-gradient(145deg, #e8f5ef, #f7f4ef)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
                    {article.cover_image ? (
                      <img src={article.cover_image} alt={article.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <span style={{ fontSize: "3.5rem", opacity: 0.4 }}>{cat.icon}</span>
                    )}
                    <div style={{ position: "absolute", top: 12, left: 12, background: "rgba(255,255,255,0.95)", color: "#2d6a4f", borderRadius: 20, padding: "4px 11px", fontSize: "0.72rem", fontWeight: 700, boxShadow: "0 2px 6px rgba(0,0,0,0.08)" }}>
                      {cat.icon} {cat.label}
                    </div>
                  </div>
                  <div style={{ padding: "18px 20px 20px" }}>
                    <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.15rem", color: "#1c2b22", marginBottom: 8, lineHeight: 1.35, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {article.title}
                    </h2>
                    {article.perex && (
                      <p style={{ color: "#4a5e52", fontSize: "0.88rem", lineHeight: 1.55, marginBottom: 12, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {article.perex}
                      </p>
                    )}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 10, borderTop: "1px solid #f7f4ef", fontSize: "0.75rem", color: "#8a9e92" }}>
                      <span>👤 {article.author_name || "Pet Market"}</span>
                      <span>{article.published_at ? new Date(article.published_at).toLocaleDateString("cs-CZ") : ""}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <footer style={{ background: "#1c2b22", color: "rgba(255,255,255,0.5)", padding: "24px", textAlign: "center", fontSize: "0.8rem" }}>
        <span style={{ fontFamily: "'DM Serif Display', serif", color: "rgba(255,255,255,0.8)", fontSize: "1rem" }}>Pet Market</span>
        {" "}· Tržiště pro mazlíčky · Celá ČR
      </footer>
    </div>
  );
}