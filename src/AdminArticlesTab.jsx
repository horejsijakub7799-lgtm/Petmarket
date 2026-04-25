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

// Timeout wrapper for promises
const withTimeout = (promise, ms = 30000, label = "operation") => {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout: ${label} trvá déle než ${ms / 1000}s`)), ms)
    ),
  ]);
};

export default function AdminArticlesTab() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [savingMode, setSavingMode] = useState(null);
  const [msg, setMsg] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  const fetchArticles = async () => {
    console.log("[fetchArticles] start");
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("articles")
        .select("id, slug, title, category, cover_image, published, views, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      console.log("[fetchArticles] loaded:", data?.length, "articles");
      setArticles(data || []);
    } catch (err) {
      console.error("[fetchArticles] error:", err);
      setMsg("❌ Chyba načítání: " + err.message);
    } finally {
      setLoading(false);
    }
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
    setMsg("⏳ Nahrávám obrázek...");
    
    try {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error("Soubor je větší než 10MB");
      }
      
      const fileName = `${Date.now()}_${file.name.replace(/[^a-z0-9.]/gi, "_")}`;
      console.log("[upload] start:", fileName, "size:", file.size);
      
      // Upload with 30s timeout
      const uploadPromise = supabase.storage
        .from("articles")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });
      
      const { error: uploadError } = await withTimeout(uploadPromise, 30000, "upload");
      
      if (uploadError) {
        console.error("[upload] supabase error:", uploadError);
        throw uploadError;
      }
      
      console.log("[upload] file uploaded, getting public URL...");
      
      const { data: urlData } = supabase.storage.from("articles").getPublicUrl(fileName);
      console.log("[upload] success, url:", urlData.publicUrl);
      
      setForm(f => ({ ...f, cover_image: urlData.publicUrl }));
      setMsg("✅ Obrázek nahrán");
      setTimeout(() => setMsg(""), 2000);
    } catch (err) {
      console.error("[upload] FULL ERROR:", err);
      setMsg("❌ Upload selhal: " + (err?.message || "neznámá chyba"));
    } finally {
      // CRITICAL: always reset state
      setUploadingImage(false);
    }
  };

  const handleSave = async (publish) => {
    console.log("[handleSave] CALLED, publish:", publish, "editing:", editing);
    
    if (!form.title.trim() || !form.slug.trim() || !form.content_markdown.trim()) {
      setMsg("⚠️ Vyplň alespoň název, slug a obsah");
      return;
    }

    const willPublish = publish;
    setSaving(true);
    setSavingMode(willPublish ? "publish" : "draft");
    setMsg("⏳ Ukládám...");

    try {
      const finalSlug = SLUGIFY(form.slug);
      
      const payload = {
        slug: finalSlug,
        title: form.title,
        meta_description: form.meta_description || null,
        category: form.category,
        cover_image: form.cover_image || null,
        perex: form.perex || null,
        content_markdown: form.content_markdown,
        author_name: form.author_name,
        published: willPublish,
      };
      
      if (willPublish) {
        payload.published_at = new Date().toISOString();
      }

      console.log("[handleSave] payload:", payload);
      console.log("[handleSave] mode:", editing === "new" ? "INSERT" : "UPDATE");

      let data, error;
      if (editing === "new") {
        const result = await withTimeout(
          supabase.from("articles").insert(payload).select().single(),
          15000,
          "insert"
        );
        data = result.data;
        error = result.error;
      } else {
        const result = await withTimeout(
          supabase.from("articles").update(payload).eq("id", editing).select().single(),
          15000,
          "update"
        );
        data = result.data;
        error = result.error;
      }

      console.log("[handleSave] data:", data);
      console.log("[handleSave] error:", error);

      if (error) throw error;

      setMsg(willPublish ? "✅ Publikováno!" : "✅ Uloženo jako koncept");
      await fetchArticles();
      
      setTimeout(() => {
        setEditing(null);
        setForm(EMPTY_FORM);
        setMsg("");
      }, 1000);
      
    } catch (err) {
      console.error("[handleSave] FULL ERROR:", err);
      console.error("[handleSave] message:", err?.message);
      console.error("[handleSave] code:", err?.code);
      console.error("[handleSave] details:", err?.details);
      console.error("[handleSave] hint:", err?.hint);
      setMsg("❌ Chyba: " + (err?.message || JSON.stringify(err)));
    } finally {
      setSaving(false);
      setSavingMode(null);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Opravdu smazat článek?")) return;
    try {
      const { error } = await supabase.from("articles").delete().eq("id", id);
      if (error) throw error;
      await fetchArticles();
    } catch (err) {
      console.error("[delete] error:", err);
      setMsg("❌ " + err.message);
    }
  };

  const togglePublish = async (article) => {
    try {
      const newState = !article.published;
      const { error } = await supabase.from("articles").update({
        published: newState,
        published_at: newState && !article.published_at ? new Date().toISOString() : article.published_at,
      }).eq("id", article.id);
      if (error) throw error;
      await fetchArticles();
    } catch (err) {
      console.error("[togglePublish] error:", err);
      setMsg("❌ " + err.message);
    }
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
            <label style={labelStyle}>Perex</label>
            <textarea value={form.perex} onChange={e => setForm(f => ({ ...f, perex: e.target.value }))} placeholder="Krátké uvedení do tématu." style={{ ...inputStyle, minHeight: 70, resize: "vertical" }} maxLength={200} />
            <div style={{ fontSize: "0.72rem", color: "#8a9e92", marginTop: 4, textAlign: "right" }}>{form.perex.length}/200</div>
          </div>

          <div>
            <label style={labelStyle}>Meta description</label>
            <textarea value={form.meta_description} onChange={e => setForm(f => ({ ...f, meta_description: e.target.value }))} placeholder="Krátký popis pro Google." style={{ ...inputStyle, minHeight: 60, resize: "vertical" }} maxLength={160} />
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
              <label style={{ display: "block", border: "2px dashed #b7d9c7", borderRadius: 10, padding: "24px", textAlign: "center", cursor: uploadingImage ? "not-allowed" : "pointer", background: "#f7f4ef", color: "#8a9e92", opacity: uploadingImage ? 0.6 : 1 }}>
                <div style={{ fontSize: "2rem", marginBottom: 6 }}>📷</div>
                <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#4a5e52" }}>{uploadingImage ? "Nahrávám... (max 30s)" : "Klikni a vyber obrázek"}</div>
                <input type="file" accept="image/*" onChange={e => handleCoverUpload(e.target.files[0])} style={{ display: "none" }} disabled={uploadingImage} />
              </label>
            )}
          </div>

          <div>
            <label style={labelStyle}>Obsah článku (Markdown)</label>
            <textarea
              value={form.content_markdown}
              onChange={e => setForm(f => ({ ...f, content_markdown: e.target.value }))}
              placeholder="# Nadpis..."
              style={{ ...inputStyle, minHeight: 360, resize: "vertical", fontFamily: "'SF Mono', 'Monaco', 'Courier New', monospace", fontSize: "0.85rem", lineHeight: 1.6 }}
            />
            <div style={{ fontSize: "0.72rem", color: "#8a9e92", marginTop: 6, lineHeight: 1.5 }}>
              Markdown: <code># H1</code>, <code>## H2</code>, <code>**tučně**</code>, <code>*kurzíva*</code>, <code>[odkaz](url)</code>, <code>- seznam</code>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Autor</label>
            <input value={form.author_name} onChange={e => setForm(f => ({ ...f, author_name: e.target.value }))} style={inputStyle} />
          </div>

          {msg && <div style={{ background: msg.includes("❌") || msg.includes("⚠️") ? "#fce4ec" : "#e8f5e9", border: `1px solid ${msg.includes("❌") || msg.includes("⚠️") ? "#f48fb1" : "#a5d6a7"}`, borderRadius: 10, padding: "10px 14px", fontSize: "0.9rem", color: msg.includes("❌") || msg.includes("⚠️") ? "#880e4f" : "#1b5e20", whiteSpace: "pre-wrap" }}>{msg}</div>}

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", paddingTop: 8, borderTop: "1px solid #ede8e0", marginTop: 8 }}>
            <button 
              onClick={() => { console.log("DRAFT button clicked"); handleSave(false); }} 
              disabled={saving || uploadingImage} 
              style={{ flex: 1, minWidth: 180, background: "#fff", color: "#2d6a4f", border: "2px solid #2d6a4f", borderRadius: 10, padding: "12px", fontSize: "0.9rem", fontWeight: 600, cursor: (saving || uploadingImage) ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif", opacity: (saving && savingMode !== "draft") || uploadingImage ? 0.5 : 1 }}
            >
              {savingMode === "draft" ? "Ukládám..." : "💾 Uložit jako koncept"}
            </button>
            <button 
              onClick={() => { console.log("PUBLISH button clicked"); handleSave(true); }} 
              disabled={saving || uploadingImage} 
              style={{ flex: 1, minWidth: 180, background: "#2d6a4f", color: "#fff", border: "none", borderRadius: 10, padding: "12px", fontSize: "0.9rem", fontWeight: 600, cursor: (saving || uploadingImage) ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif", boxShadow: "0 2px 12px rgba(45,106,79,0.25)", opacity: (saving && savingMode !== "publish") || uploadingImage ? 0.5 : 1 }}
            >
              {savingMode === "publish" ? "Publikuji..." : "🚀 Publikovat"}
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
                  <button onClick={() => togglePublish(article)} style={{ background: article.published ? "#fff8e1" : "#2d6a4f", color: article.published ? "#7a5b00" : "#fff", border: "none", borderRadius: 8, padding: "8px 12px", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
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