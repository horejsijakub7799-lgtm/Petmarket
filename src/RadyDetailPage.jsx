import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "./supabase";

const CATEGORIES = {
  "psi": { label: "Psi", icon: "🐕" },
  "kocky": { label: "Kočky", icon: "🐈" },
  "mali-mazlicci": { label: "Malí mazlíčci", icon: "🐹" },
  "zdravi": { label: "Zdraví & veterinář", icon: "💊" },
  "vycvik": { label: "Výcvik", icon: "🎓" },
  "krmeni": { label: "Krmení & výživa", icon: "🦴" },
  "recenze": { label: "Recenze & testy", icon: "🛍️" },
};

// Jednoduchý markdown → HTML renderer
function renderMarkdown(md) {
  if (!md) return "";
  let html = md;

  // Headings
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Bold, italic
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Links
  html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

  // Images
  html = html.replace(/!\[(.*?)\]\((.+?)\)/g, '<img src="$2" alt="$1" />');

  // Unordered lists
  html = html.replace(/^\- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, match => `<ul>${match}</ul>`);

  // Blockquotes
  html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');

  // Paragraphs (consecutive lines not already wrapped)
  html = html.split(/\n\n+/).map(block => {
    if (block.match(/^<(h[1-6]|ul|ol|blockquote|img|p)/)) return block;
    if (block.trim() === "") return "";
    return `<p>${block.replace(/\n/g, '<br>')}</p>`;
  }).join("\n");

  return html;
}

export default function RadyDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [related, setRelated] = useState([]);

  useEffect(() => {
    const fetchArticle = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .eq("slug", slug)
        .eq("published", true)
        .maybeSingle();

      if (error || !data) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setArticle(data);
      setLoading(false);

      // Increment views
      supabase.rpc("increment_article_views", { article_slug: slug });

      // Fetch related
      const { data: relatedData } = await supabase
        .from("articles")
        .select("slug, title, category, cover_image, perex")
        .eq("published", true)
        .eq("category", data.category)
        .neq("id", data.id)
        .limit(3);
      setRelated(relatedData || []);

      // SEO
      document.title = `${data.title} — Pet Market`;
      const metaDesc = document.querySelector('meta[name="description"]');
      const desc = data.meta_description || data.perex || "";
      if (metaDesc) metaDesc.setAttribute("content", desc);
      else {
        const m = document.createElement("meta");
        m.name = "description";
        m.content = desc;
        document.head.appendChild(m);
      }

      // Open Graph
      const setOg = (property, content) => {
        let tag = document.querySelector(`meta[property="${property}"]`);
        if (!tag) {
          tag = document.createElement("meta");
          tag.setAttribute("property", property);
          document.head.appendChild(tag);
        }
        tag.setAttribute("content", content);
      };
      setOg("og:title", data.title);
      setOg("og:description", desc);
      setOg("og:type", "article");
      setOg("og:url", window.location.href);
      if (data.cover_image) setOg("og:image", data.cover_image);

      // Article schema (JSON-LD)
      const existingSchema = document.getElementById("article-schema");
      if (existingSchema) existingSchema.remove();
      const schema = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": data.title,
        "description": desc,
        "image": data.cover_image || undefined,
        "author": { "@type": "Person", "name": data.author_name || "Pet Market" },
        "publisher": { "@type": "Organization", "name": "Pet Market", "logo": { "@type": "ImageObject", "url": "https://petmarket-theta.vercel.app/logo.png" } },
        "datePublished": data.published_at,
        "dateModified": data.updated_at,
      };
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.id = "article-schema";
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
    };

    fetchArticle();
    window.scrollTo(0, 0);

    return () => {
      const schema = document.getElementById("article-schema");
      if (schema) schema.remove();
    };
  }, [slug]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f7f4ef" }}>
        <div style={{ color: "#8a9e92" }}>Načítám...</div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#f7f4ef", textAlign: "center", padding: 20 }}>
        <div style={{ fontSize: "4rem", marginBottom: 16 }}>😿</div>
        <h2 style={{ fontFamily: "'DM Serif Display', serif", color: "#1c2b22", marginBottom: 10 }}>Článek nenalezen</h2>
        <p style={{ color: "#8a9e92", marginBottom: 20 }}>Tento článek neexistuje nebo byl smazán.</p>
        <button onClick={() => navigate("/rady")} style={{ background: "#2d6a4f", color: "#fff", border: "none", borderRadius: 10, padding: "12px 24px", fontSize: "0.95rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>← Zpět na Rady</button>
      </div>
    );
  }

  const cat = CATEGORIES[article.category] || { label: "Obecné", icon: "🐾" };

  return (
    <div style={{ minHeight: "100vh", background: "#f7f4ef", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        .article-content h1 { font-family: 'DM Serif Display', serif; font-size: 1.8rem; color: #1c2b22; margin: 28px 0 14px; line-height: 1.3; }
        .article-content h2 { font-family: 'DM Serif Display', serif; font-size: 1.5rem; color: #1c2b22; margin: 24px 0 12px; line-height: 1.35; }
        .article-content h3 { font-family: 'DM Serif Display', serif; font-size: 1.2rem; color: #1c2b22; margin: 20px 0 10px; }
        .article-content p { color: #3c4a42; font-size: 1rem; line-height: 1.75; margin-bottom: 16px; }
        .article-content ul { padding-left: 24px; margin-bottom: 16px; }
        .article-content li { color: #3c4a42; line-height: 1.7; margin-bottom: 6px; }
        .article-content a { color: #2d6a4f; text-decoration: underline; }
        .article-content strong { color: #1c2b22; font-weight: 700; }
        .article-content blockquote { border-left: 4px solid #2d6a4f; background: #f2faf6; padding: 14px 20px; margin: 20px 0; color: #4a5e52; font-style: italic; border-radius: 4px; }
        .article-content img { max-width: 100%; height: auto; border-radius: 12px; margin: 20px 0; }
      `}</style>

      <nav style={{ background: "#fff", borderBottom: "1px solid #ede8e0", height: 64, display: "flex", alignItems: "center", padding: "0 32px", gap: 16, position: "sticky", top: 0, zIndex: 100, boxShadow: "0 1px 12px rgba(44,80,58,0.07)" }}>
        <button onClick={() => navigate("/")} style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer" }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: "#2d6a4f", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>🐾</div>
          <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.15rem", color: "#1c2b22" }}>Pet Market</span>
        </button>
        <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
          <button onClick={() => navigate("/rady")} style={{ background: "#fff", color: "#2d6a4f", border: "2px solid #2d6a4f", borderRadius: 10, padding: "8px 18px", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>← Všechny rady</button>
        </div>
      </nav>

      {/* Cover image */}
      {article.cover_image && (
        <div style={{ height: 360, background: "#e8f5ef", overflow: "hidden" }}>
          <img src={article.cover_image} alt={article.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      )}

      <main style={{ maxWidth: 780, margin: "0 auto", padding: "40px 24px 60px" }}>
        {/* Breadcrumbs */}
        <div style={{ fontSize: "0.82rem", color: "#8a9e92", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={() => navigate("/")} style={{ background: "none", border: "none", color: "#8a9e92", cursor: "pointer", padding: 0, fontFamily: "'DM Sans', sans-serif", fontSize: "0.82rem" }}>Domů</button>
          <span>›</span>
          <button onClick={() => navigate("/rady")} style={{ background: "none", border: "none", color: "#8a9e92", cursor: "pointer", padding: 0, fontFamily: "'DM Sans', sans-serif", fontSize: "0.82rem" }}>Rady</button>
          <span>›</span>
          <button onClick={() => navigate(`/rady?kategorie=${article.category}`)} style={{ background: "none", border: "none", color: "#2d6a4f", cursor: "pointer", padding: 0, fontFamily: "'DM Sans', sans-serif", fontSize: "0.82rem", fontWeight: 600 }}>{cat.label}</button>
        </div>

        {/* Category badge */}
        <div style={{ marginBottom: 16 }}>
          <span style={{ background: "#e8f5ef", color: "#2d6a4f", border: "1px solid #b7d9c7", borderRadius: 20, padding: "4px 14px", fontSize: "0.78rem", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span>{cat.icon}</span>{cat.label}
          </span>
        </div>

        {/* Title */}
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(1.7rem, 3.5vw, 2.4rem)", color: "#1c2b22", lineHeight: 1.25, marginBottom: 16, letterSpacing: "-0.02em" }}>
          {article.title}
        </h1>

        {/* Perex */}
        {article.perex && (
          <p style={{ fontSize: "1.1rem", color: "#4a5e52", lineHeight: 1.6, marginBottom: 20, fontStyle: "italic" }}>
            {article.perex}
          </p>
        )}

        {/* Meta */}
        <div style={{ display: "flex", gap: 16, alignItems: "center", paddingBottom: 24, marginBottom: 32, borderBottom: "1px solid #ede8e0", fontSize: "0.85rem", color: "#8a9e92" }}>
          <span>👤 {article.author_name || "Pet Market"}</span>
          <span>·</span>
          <span>{article.published_at ? new Date(article.published_at).toLocaleDateString("cs-CZ", { day: "numeric", month: "long", year: "numeric" }) : ""}</span>
          {article.views > 0 && (<><span>·</span><span>👁 {article.views} zobrazení</span></>)}
        </div>

        {/* Content */}
        <article className="article-content" dangerouslySetInnerHTML={{ __html: renderMarkdown(article.content_markdown) }} />

        {/* Share & CTA */}
        <div style={{ marginTop: 40, padding: "24px", background: "#fff", borderRadius: 16, border: "1px solid #ede8e0", textAlign: "center" }}>
          <div style={{ fontSize: "2rem", marginBottom: 8 }}>🐾</div>
          <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.2rem", color: "#1c2b22", marginBottom: 10 }}>Hledáš pro svého mazlíčka?</h3>
          <p style={{ color: "#4a5e52", fontSize: "0.9rem", marginBottom: 16 }}>Na Pet Marketu najdeš bazar, veterináře, hotely i venčení — vše na jednom místě.</p>
          <button onClick={() => navigate("/")} style={{ background: "#2d6a4f", color: "#fff", border: "none", borderRadius: 10, padding: "12px 24px", fontSize: "0.95rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", boxShadow: "0 2px 12px rgba(45,106,79,0.25)" }}>
            Prozkoumat Pet Market →
          </button>
        </div>

        {/* Related articles */}
        {related.length > 0 && (
          <div style={{ marginTop: 40 }}>
            <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.3rem", color: "#1c2b22", marginBottom: 16 }}>Další články v kategorii {cat.label}</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
              {related.map(r => (
                <div
                  key={r.slug}
                  onClick={() => navigate(`/rady/${r.slug}`)}
                  style={{ background: "#fff", borderRadius: 12, border: "1px solid #ede8e0", overflow: "hidden", cursor: "pointer", transition: "transform 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.transform = "translateY(-3px)"}
                  onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
                >
                  <div style={{ height: 110, background: "linear-gradient(145deg, #e8f5ef, #f7f4ef)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                    {r.cover_image ? <img src={r.cover_image} alt={r.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: "2rem", opacity: 0.4 }}>{cat.icon}</span>}
                  </div>
                  <div style={{ padding: "12px 14px 14px" }}>
                    <div style={{ fontWeight: 600, color: "#1c2b22", fontSize: "0.88rem", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {r.title}
                    </div>
                  </div>
                </div>
              ))}
            </div>
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