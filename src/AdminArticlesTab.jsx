import { useState, useEffect } from "react";
import { supabase } from "./supabase";

const CATEGORIES = [
  { id: "psi", label: "Psi", icon: "🐕" },
  { id: "kocky", label: "Kočky", icon: "🐈" },
  { id: "mali-mazlicci", label: "Malí mazlíčci", icon: "🐹" },
  { id: "zdravi", label: "Zdraví & veterinář", icon: "💊" },
  { id: "vycvik", label: "Výcvik", icon: "🎓" },
  { id: "krmeni", label: "Krmení & výživa", icon: "🦴" },
  { id: "recenze", label: "Recenze & testy", icon: "🛍️" },
];

const SLUGIFY = (text) => {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 80);
};

const EMPTY_FORM = {
  slug: "",
  title: "",
  meta_description: "",
  category: "psi",
  cover_image: "",
  perex: "",
  content_markdown: "",
  author_name: "Pet Market",
  published: false,
};

export default function AdminArticlesTab() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  const fetchArticles = async () => {
    setLoading(true);
    const { data } = await supabase.from("articles").select("*").order("created_at", { ascending: false });
    setArticles(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const startNew = () => {
    setForm(EMPTY_FORM);
    setEditing("new");
    setMsg("");
  };

  const startEdit = (article) => {
    setForm({
      slug: article.slug || "",
      title: article.title || "",
      meta_description: article.meta_description || "",
      category: article.category || "psi",
      cover_image: article.cover_image || "",
      perex: article.perex || "",
      content_markdown: article.content_markdown || "",
      author_name: article.author_name || "Pet Market",
      published: article.published || false,
    });
    setEditing(article.id);
    setMsg("");
  };

  const handleTitleChange = (val) => {
    setForm(f => ({
      ...f,
      title: val,
      slug: (!editing || editing === "new") && !f.slug ? SLUGIFY(val) : f.slug,
    }));
  };

  const handleCoverUpload = async (file) => {
    if (!file) return;
    setUploadingImage(true);
    try {
      const fileName = `${Date.now()}_${file.name.replace(/[^a-z0-9.]/gi, "_")}`;
      const { error: uploadError } = await supabase.storage.from("articles").upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("articles").getPublicUrl(fileName);
      setForm(f => ({ ...f, cover_image: urlData.publicUrl }));
      setMsg("✅ Obrázek nahrán");
      setTimeout(() => setMsg(""), 2000);
    } catch (err) {
      setMsg("❌ Chyba při nahrávání: " + err.message);
    }
    setUploadingImage(false);
  };

  const handleSave = async (publish = null) => {
    if (!form.title.trim() || !form.slug.trim() || !form.content_markdown.trim()) {
      setMsg("⚠️ Vyplň alespoň název, slug a obsah");
      return;
    }

    setSaving(true);
    setMsg("");

    const finalSlug = SLUGIFY(form.slug);
    const willPublish = publish !== null ? publish : form.published;

    const payload = {
      ...form,
      slug: finalSlug,
      published: willPublish,
      published_at: willPublish && !form.published ? new Date().toISOString() : undefined,
    };

    // Remove undefined
    Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);

    try {
      let result;
      if (editing === "new") {
        result = await supabase.from("articles").insert(payload).select().single();
      } else {
        result = await supabase.from("articles").update(payload).eq("id", editing).select().single();
      }

      if (result.error) throw result.error;

      setMsg(willPublish ? "✅ Publikováno!" : "✅ Uloženo jako koncept");
      await fetchArticles();
      setEditing(null);
      setForm(EMPTY_FORM);
      setTimeout(() => setMsg(""), 3000);
    } catch (err) {
      console.error(err);
      setMsg("❌ Chyba: " + err.message);
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("Opravdu smazat článek? Nevratná akce.")) return;
    await supabase.from("articles").delete().eq("id", id);
    await fetchArticles();
  };

  const togglePublish = async (article) => {
    const newState = !article.published;
    await supabase.from("articles").update({
      published: newState,
      published_at: newState && !article.published_at ? new Date().toISOString() : article.published_at,
    }).eq("id", article.id);
    await fetchArticles();
  };

  const inputStyle = { width: "100%", border: "1.5px solid #ede8e0", borderRadius: 10, padding: "10px 14px", fontSize: "0.9rem", outline: "none", fontFamily: "'DM Sans', sans-serif", background: "#f7f4ef", boxSizing: "border-box", color: "#1c2b22" };
  const labelStyle = { fontSize: "0.72rem", fontWeight: 600, color: "#8a9e92", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 };

  if (editing !== null) {
    return (
      <div style={{ background: "#fff", borderRadius: 16, padding: "28px 32px", border: "1px solid #ede8e0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.4rem", color: "#1c2b22", margin: 0 }}>
            {editing === "new" ? "➕ Nový článek" : "✏️ Upravit článek"}
          </h2>
          <button onClick={() => { setEditing(null); setForm(EMPTY_FORM); setMsg(""); }} style={{ background: "#fff", color: "#6b7280", border: "1.5px solid #ede8e0", borderRadius: 10, padding: "8px 16px", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
            ← Zpět na seznam
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <label style={labelStyle}>Název článku *</label>
            <input value={form.title} onChange={e => handleTitleChange(e.target.value)} placeholder="Jak vybrat správné krmivo pro psa" style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Slug (URL) *</label>
            <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: SLUGIFY(e.target.value) }))} placeholder="jak-vybrat-spravne-krmivo-pro-psa" style={inputStyle} />
            <div style={{ fontSize: "0.72rem", color: "#8a9e92", marginTop: 4 }}>URL: /rady/{form.slug || "slug-clanku"}</div>
          </div>

          <div>
            <label style={labelStyle}>Kategorie *</label>
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={{ ...inputStyle, cursor: "pointer" }}>
              {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Perex (krátký úvod, 1-2 věty)</label>
            <textarea value={form.perex} onChange={e => setForm(f => ({ ...f, perex: e.target.value }))} placeholder="Krátké uvedení do tématu, zobrazí se v přehledu a v detailu článku." style={{ ...inputStyle, minHeight: 70, resize: "vertical" }} maxLength={200} />
            <div style={{ fontSize: "0.72rem", color: "#8a9e92", marginTop: 4, textAlign: "right" }}>{form.perex.length}/200</div>
          </div>

          <div>
            <label style={labelStyle}>Meta description (pro SEO, max 160 znaků)</label>
            <textarea value={form.meta_description} onChange={e => setForm(f => ({ ...f, meta_description: e.target.value }))} placeholder="Krátký popis pro Google výsledky. Pokud nevyplníš, použije se perex." style={{ ...inputStyle, minHeight: 60, resize: "vertical" }} maxLength={160} />
            <div style={{ fontSize: "0.72rem", color: "#8a9e92", marginTop: 4, textAlign: "right" }}>{form.meta_description.length}/160</div>
          </div>

          <div>
            <label style={labelStyle}>Obrázek k článku (cover)</label>
            {form.cover_image ? (
              <div style={{ position: "relative", marginBottom: 8 }}>
                <img src={form.cover_image} alt="" style={{ width: "100%", maxHeight: 240, objectFit: "cover", borderRadius: 10, border: "1.5px solid #ede8e0" }} />
                <button onClick={() => setForm(f => ({ ...f, cover_image: "" }))} style={{ position: "absolute", top: 8, right: 8, background: "#b91c1c", color: "#fff", border: "none", borderRadius: 20, padding: "4px 12px", cursor: "pointer", fontSize: "0.75rem", fontWeight: 600 }}>✕ Odebrat</button>
              </div>
            ) : (
              <label style={{ display: "block", border: "2px dashed #b7d9c7", borderRadius: 10, padding: "24px", textAlign: "center", cursor: "pointer", background: "#f7f4ef", color: "#8a9e92" }}>
                <div style={{ fontSize: "2rem", marginBottom: 6 }}>📷</div>
                <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#4a5e52" }}>{uploadingImage ? "Nahrávám..." : "Klikni a vyber obrázek"}</div>
                <input type="file" accept="image/*" onChange={e => handleCoverUpload(e.target.files[0])} style={{ display: "none" }} />
              </label>
            )}
          </div>

          <div>
            <label style={labelStyle}>Obsah článku (Markdown)</label>
            <textarea
              value={form.content_markdown}
              onChange={e => setForm(f => ({ ...f, content_markdown: e.target.value }))}
              placeholder={`# Hlavní nadpis

Toto je úvodní odstavec článku.

## Podnadpis

- Bod 1
- Bod 2
- Bod 3

**Tučný text** a *kurzíva*.

[Odkaz na něco](https://priklad.cz)

> Citace nebo důležité upozornění.

![Popis obrázku](https://obrazek.cz/foto.jpg)`}
              style={{ ...inputStyle, minHeight: 360, resize: "vertical", fontFamily: "'SF Mono', 'Monaco', 'Courier New', monospace", fontSize: "0.85rem", lineHeight: 1.6 }}
            />
            <div style={{ fontSize: "0.72rem", color: "#8a9e92", marginTop: 6, lineHeight: 1.5 }}>
              Markdown podpora: <code># H1</code>, <code>## H2</code>, <code>### H3</code>, <code>**tučně**</code>, <code>*kurzíva*</code>, <code>[odkaz](url)</code>, <code>![obr](url)</code>, <code>- seznam</code>, <code>{"> citace"}</code>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Autor</label>
            <input value={form.author_name} onChange={e => setForm(f => ({ ...f, author_name: e.target.value }))} style={inputStyle} />
          </div>

          {msg && <div style={{ background: msg.includes("❌") || msg.includes("⚠️") ? "#fce4ec" : "#e8f5e9", border: `1px solid ${msg.includes("❌") || msg.includes("⚠️") ? "#f48fb1" : "#a5d6a7"}`, borderRadius: 10, padding: "10px 14px", fontSize: "0.9rem", color: msg.includes("❌") || msg.includes("⚠️") ? "#880e4f" : "#1b5e20" }}>{msg}</div>}

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", paddingTop: 8, borderTop: "1px solid #ede8e0", marginTop: 8 }}>
            <button onClick={() => handleSave(false)} disabled={saving} style={{ flex: 1, minWidth: 180, background: "#fff", color: "#2d6a4f", border: "2px solid #2d6a4f", borderRadius: 10, padding: "12px", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
              {saving ? "Ukládám..." : "💾 Uložit jako koncept"}
            </button>
            <button onClick={() => handleSave(true)} disabled={saving} style={{ flex: 1, minWidth: 180, background: "#2d6a4f", color: "#fff", border: "none", borderRadius: 10, padding: "12px", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", boxShadow: "0 2px 12px rgba(45,106,79,0.25)" }}>
              {saving ? "Publikuji..." : "🚀 Publikovat"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "#fff", borderRadius: 16, padding: "28px 32px", border: "1px solid #ede8e0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.4rem", color: "#1c2b22", margin: 0 }}>📝 Správa článků</h2>
        <button onClick={startNew} style={{ background: "#2d6a4f", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
          ➕ Nový článek
        </button>
      </div>

      {msg && <div style={{ background: msg.includes("❌") ? "#fce4ec" : "#e8f5e9", border: `1px solid ${msg.includes("❌") ? "#f48fb1" : "#a5d6a7"}`, borderRadius: 10, padding: "10px 14px", fontSize: "0.9rem", color: msg.includes("❌") ? "#880e4f" : "#1b5e20", marginBottom: 16 }}>{msg}</div>}

      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "#8a9e92" }}>Načítám...</div>
      ) : articles.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 20px", color: "#8a9e92" }}>
          <div style={{ fontSize: "3rem", marginBottom: 12 }}>📝</div>
          <p style={{ fontSize: "0.95rem", marginBottom: 6 }}>Zatím žádné články</p>
          <p style={{ fontSize: "0.82rem" }}>Klikni na "➕ Nový článek" a napiš první</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {articles.map(article => {
            const cat = CATEGORIES.find(c => c.id === article.category) || { icon: "🐾", label: article.category };
            return (
              <div key={article.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: 14, border: "1px solid #ede8e0", borderRadius: 12, background: article.published ? "#fff" : "#f7f4ef" }}>
                <div style={{ width: 60, height: 60, borderRadius: 10, background: "#e8f5ef", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {article.cover_image ? <img src={article.cover_image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: "1.6rem" }}>{cat.icon}</span>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                    <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#2d6a4f", background: "#e8f5ef", padding: "2px 8px", borderRadius: 20, textTransform: "uppercase" }}>
                      {cat.icon} {cat.label}
                    </span>
                    {article.published ? (
                      <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#1b5e20", background: "#c8e6c9", padding: "2px 8px", borderRadius: 20 }}>✅ Publikováno</span>
                    ) : (
                      <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#7a5b00", background: "#fff8e1", padding: "2px 8px", borderRadius: 20 }}>📝 Koncept</span>
                    )}
                  </div>
                  <div style={{ fontWeight: 600, color: "#1c2b22", fontSize: "0.92rem", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{article.title}</div>
                  <div style={{ fontSize: "0.75rem", color: "#8a9e92", display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <span>/{article.slug}</span>
                    <span>👁 {article.views || 0}</span>
                    <span>{new Date(article.created_at).toLocaleDateString("cs-CZ")}</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button onClick={() => togglePublish(article)} title={article.published ? "Skrýt" : "Publikovat"} style={{ background: article.published ? "#fff8e1" : "#2d6a4f", color: article.published ? "#7a5b00" : "#fff", border: "none", borderRadius: 8, padding: "8px 12px", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                    {article.published ? "📝 Skrýt" : "🚀 Publikovat"}
                  </button>
                  <button onClick={() => startEdit(article)} style={{ background: "#fff", color: "#2d6a4f", border: "1.5px solid #2d6a4f", borderRadius: 8, padding: "8px 12px", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>✏️</button>
                  <button onClick={() => handleDelete(article.id)} style={{ background: "#fff", color: "#b91c1c", border: "1.5px solid #fecaca", borderRadius: 8, padding: "8px 12px", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>🗑️</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}