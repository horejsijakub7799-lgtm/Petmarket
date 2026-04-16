import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./useAuth";
import { supabase } from "./supabase";

const SELLER_MENU = [
  { id: "prehled", label: "Přehled", icon: "📊" },
  { id: "produkty", label: "Moje produkty", icon: "🛍️" },
  { id: "pridat", label: "Přidat produkt", icon: "➕" },
  { id: "import", label: "CSV import", icon: "📥" },
  { id: "objednavky", label: "Objednávky", icon: "📦" },
  { id: "doprava", label: "Nastavení dopravy", icon: "🚚" },
  { id: "profil", label: "Profil obchodu", icon: "🏪" },
];

const KATEGORIE = ["Krmivo", "Hračky", "Obojky a vodítka", "Pelíšky", "Hygiena", "Doplňky", "Jiné"];
const ZVIRATA = ["Pes", "Kočka", "Hlodavec", "Pták", "Ryba", "Plaz", "Jiné"];

const statusColor = {
  pending: { bg: "#fff8e1", color: "#e65100", label: "Čeká" },
  paid: { bg: "#e8f5e9", color: "#1b5e20", label: "Zaplaceno" },
  shipped: { bg: "#e3f2fd", color: "#0d47a1", label: "Odesláno" },
  delivered: { bg: "#f3e5f5", color: "#4a148c", label: "Doručeno" },
  cancelled: { bg: "#fce4ec", color: "#880e4f", label: "Zrušeno" },
};

function CsvImport({ user, sellerProfile, onSuccess }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [importing, setImporting] = useState(false);
  const [msg, setMsg] = useState("");

  const inputStyle = { width: "100%", border: "1.5px solid #ede8e0", borderRadius: 10, padding: "10px 14px", fontSize: "0.9rem", outline: "none", fontFamily: "'DM Sans', sans-serif", background: "#f7f4ef", boxSizing: "border-box", color: "#1c2b22" };

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result.replace(/^\uFEFF/, "");
      const lines = text.split("\n").filter(l => l.trim());
      const rows = lines.slice(1).map(line => {
        const cols = line.split(",").map(c => c.trim().replace(/^"|"$/g, ""));
        return { title: cols[0], description: cols[1], price: cols[2], category: cols[3], animal: cols[4], stock: cols[5] };
      }).filter(r => r.title);
      setPreview(rows);
    };
    reader.readAsText(f, "UTF-8");
  };

  const handleImport = async () => {
    if (!preview.length) return;
    setImporting(true); setMsg("");
    try {
      const products = preview.map(r => ({
        seller_id: user.id,
        seller_name: sellerProfile?.name || user.email,
        title: r.title,
        description: r.description || "",
        price: parseFloat(r.price) || 0,
        category: r.category || "Jiné",
        animal: r.animal || "",
        stock: parseInt(r.stock) || 0,
        foto_urls: [],
        active: true,
      }));
      const { error } = await supabase.from("products").insert(products);
      if (error) throw error;
      setMsg(`✅ Importováno ${products.length} produktů!`);
      setFile(null); setPreview([]);
      setTimeout(() => onSuccess(), 1500);
    } catch (err) { setMsg("❌ Chyba: " + err.message); }
    setImporting(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <input type="file" accept=".csv" onChange={handleFile} style={{ ...inputStyle, padding: "8px 14px" }} />
      {preview.length > 0 && (
        <div>
          <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1c2b22", marginBottom: 10 }}>Náhled ({preview.length} produktů):</div>
          <div style={{ border: "1px solid #ede8e0", borderRadius: 10, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
              <thead>
                <tr style={{ background: "#f7f4ef" }}>
                  {["Název", "Cena", "Kategorie", "Zvíře", "Sklad"].map(h => (
                    <th key={h} style={{ padding: "8px 12px", textAlign: "left", color: "#8a9e92", fontWeight: 600, borderBottom: "1px solid #ede8e0" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.slice(0, 5).map((row, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #f7f4ef" }}>
                    <td style={{ padding: "8px 12px", color: "#1c2b22" }}>{row.title}</td>
                    <td style={{ padding: "8px 12px", color: "#2d6a4f", fontWeight: 600 }}>{row.price} Kč</td>
                    <td style={{ padding: "8px 12px", color: "#4a5e52" }}>{row.category}</td>
                    <td style={{ padding: "8px 12px", color: "#4a5e52" }}>{row.animal}</td>
                    <td style={{ padding: "8px 12px", color: "#4a5e52" }}>{row.stock} ks</td>
                  </tr>
                ))}
                {preview.length > 5 && (
                  <tr><td colSpan={5} style={{ padding: "8px 12px", color: "#8a9e92", textAlign: "center" }}>... a dalších {preview.length - 5} produktů</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <button onClick={handleImport} disabled={importing} style={{ marginTop: 14, width: "100%", background: importing ? "#b5cec0" : "#2d6a4f", color: "#fff", border: "none", borderRadius: 10, padding: "14px", fontSize: "1rem", fontWeight: 600, cursor: importing ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif" }}>
            {importing ? "Importuji..." : `✓ Importovat ${preview.length} produktů`}
          </button>
        </div>
      )}
      {msg && <div style={{ background: msg.includes("❌") ? "#fce4ec" : "#e8f5e9", border: `1px solid ${msg.includes("❌") ? "#f48fb1" : "#a5d6a7"}`, borderRadius: 10, padding: "10px 14px", fontSize: "0.85rem", color: msg.includes("❌") ? "#880e4f" : "#1b5e20" }}>{msg}</div>}
    </div>
  );
}

export default function SellerDashboard() {
  const { user, profile, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("prehled");
  const [sellerProfile, setSellerProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [produkty, setProdukty] = useState([]);
  const [objednavky, setObjednavky] = useState([]);
  const [doprava, setDoprava] = useState([]);
  const [filterStatus, setFilterStatus] = useState("vse");
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [productForm, setProductForm] = useState({ title: "", description: "", price: "", stock: 1, category: "", animal: "" });
  const [productPhotos, setProductPhotos] = useState([]);
  const [productSaving, setProductSaving] = useState(false);
  const [productMsg, setProductMsg] = useState("");

  const [dopravaNova, setDopravaNova] = useState({ name: "", price: "" });
  const [dopravaSaving, setDopravaSaving] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/"); return; }
    fetchSellerProfile();
  }, [user, authLoading]);

  const fetchSellerProfile = async () => {
    setLoading(true);
    const { data } = await supabase.from("partner_profiles").select("*").eq("user_id", user.id).eq("type", "seller").eq("approved", true).single();
    if (!data) { navigate("/partneri"); return; }
    setSellerProfile(data);
    setLoading(false);
    fetchProdukty();
    fetchObjednavky();
    fetchDoprava();
  };

  const fetchProdukty = async () => {
    const { data } = await supabase.from("products").select("*").eq("seller_id", user.id).order("created_at", { ascending: false });
    if (data) setProdukty(data);
  };

  const fetchObjednavky = async () => {
    const { data } = await supabase.from("orders").select("*, order_items(*)").eq("seller_id", user.id).order("created_at", { ascending: false });
    if (data) setObjednavky(data);
  };

  const fetchDoprava = async () => {
    const { data } = await supabase.from("shipping_options").select("*").eq("seller_id", user.id).order("created_at", { ascending: true });
    if (data) setDoprava(data);
  };

  const compressImage = (file) => new Promise((resolve) => {
    const canvas = document.createElement("canvas"); const img = new Image();
    img.onload = () => {
      const max = 800; let w = img.width, h = img.height;
      if (w > max) { h = (h * max) / w; w = max; }
      if (h > max) { w = (w * max) / h; h = max; }
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.75);
    };
    img.src = URL.createObjectURL(file);
  });

  const handleProductSubmit = async () => {
    if (!productForm.title || !productForm.price || !productForm.category) {
      setProductMsg("⚠️ Vyplň název, cenu a kategorii."); return;
    }
    setProductSaving(true); setProductMsg("");
    try {
      const urls = [];
      for (const file of productPhotos) {
        const compressed = await compressImage(file);
        const path = `${user.id}/${Date.now()}-${file.name}`;
        const { error: upErr } = await supabase.storage.from("products").upload(path, compressed, { contentType: "image/jpeg" });
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage.from("products").getPublicUrl(path);
        urls.push(urlData.publicUrl);
      }
      const { error } = await supabase.from("products").insert({
        seller_id: user.id,
        seller_name: sellerProfile?.name || profile?.name || user.email,
        title: productForm.title,
        description: productForm.description,
        price: parseFloat(productForm.price),
        category: productForm.category,
        animal: productForm.animal,
        stock: parseInt(productForm.stock),
        foto_urls: urls,
        active: true,
      });
      if (error) throw error;
      setProductMsg("✅ Produkt přidán!");
      setProductForm({ title: "", description: "", price: "", stock: 1, category: "", animal: "" });
      setProductPhotos([]);
      fetchProdukty();
      setTimeout(() => { setProductMsg(""); setActiveTab("produkty"); }, 1500);
    } catch (err) { setProductMsg("❌ Chyba: " + err.message); }
    setProductSaving(false);
  };

  const handleToggleActive = async (produkt) => {
    await supabase.from("products").update({ active: !produkt.active }).eq("id", produkt.id);
    fetchProdukty();
  };

  const handleDeleteProdukt = async (id) => {
    if (!window.confirm("Smazat produkt?")) return;
    await supabase.from("products").delete().eq("id", id);
    fetchProdukty();
  };

  const handleAddDoprava = async () => {
    if (!dopravaNova.name || !dopravaNova.price) return;
    setDopravaSaving(true);
    await supabase.from("shipping_options").insert({ seller_id: user.id, name: dopravaNova.name, price: parseFloat(dopravaNova.price) });
    setDopravaNova({ name: "", price: "" });
    fetchDoprava();
    setDopravaSaving(false);
  };

  const handleDeleteDoprava = async (id) => {
    await supabase.from("shipping_options").delete().eq("id", id);
    fetchDoprava();
  };

  const handleSignOut = async () => { await signOut(); navigate("/"); };

  const handleUpdateStatus = async (orderId, status) => {
    await supabase.from("orders").update({ status }).eq("id", orderId);
    fetchObjednavky();
  };

  const exportCSV = () => {
    const rows = [["ID", "Zákazník", "Email", "Telefon", "Adresa", "Produkty (Kč)", "Doprava (Kč)", "Celkem (Kč)", "Status", "Datum"]];
    filteredObjednavky.forEach(o => {
      rows.push([
        o.id.slice(0, 8).toUpperCase(),
        o.buyer_name || "",
        o.buyer_email || "",
        o.buyer_phone || "",
        o.buyer_address || "",
        o.total_products || 0,
        o.shipping_price || 0,
        o.total_price || 0,
        statusColor[o.status]?.label || o.status,
        new Date(o.created_at).toLocaleDateString("cs-CZ"),
      ]);
    });
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "objednavky.csv"; a.click();
  };

  const filteredObjednavky = objednavky
    .filter(o => filterStatus === "vse" || o.status === filterStatus)
    .filter(o => !dateFrom || new Date(o.created_at) >= new Date(dateFrom))
    .filter(o => !dateTo || new Date(o.created_at) <= new Date(dateTo + "T23:59:59"));

  const trzbyCelkem = objednavky.filter(o => ["paid", "shipped", "delivered"].includes(o.status)).reduce((s, o) => s + (o.total_products || 0), 0);
  const trzbyProvize = Math.round(trzbyCelkem * 0.1);
  const trzbyNetto = trzbyCelkem - trzbyProvize;

  const inputStyle = { width: "100%", border: "1.5px solid #ede8e0", borderRadius: 10, padding: "10px 14px", fontSize: "0.9rem", outline: "none", fontFamily: "'DM Sans', sans-serif", background: "#f7f4ef", boxSizing: "border-box", color: "#1c2b22" };
  const labelStyle = { fontSize: "0.72rem", fontWeight: 600, color: "#8a9e92", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 };

  if (authLoading || loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ textAlign: "center", color: "#8a9e92" }}>
        <div style={{ fontSize: "2rem", marginBottom: 12 }}>🛍️</div>
        <p>Načítám dashboard...</p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f7f4ef", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600;700&display=swap');`}</style>
      <nav style={{ background: "#fff", borderBottom: "1px solid #ede8e0", height: 64, display: "flex", alignItems: "center", padding: "0 32px", gap: 16, position: "sticky", top: 0, zIndex: 100, boxShadow: "0 1px 12px rgba(44,80,58,0.07)" }}>
        <button onClick={() => navigate("/")} style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer" }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: "#2d6a4f", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>🐾</div>
          <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.15rem", color: "#1c2b22" }}>Pet Market</span>
        </button>
        <span style={{ background: "#e8f5ef", color: "#2d6a4f", border: "1px solid #b7d9c7", borderRadius: 20, padding: "3px 12px", fontSize: "0.78rem", fontWeight: 600 }}>🏪 Partnerský prodejce</span>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: "0.85rem", color: "#4a5e52" }}>{sellerProfile?.name}</span>
          <button onClick={handleSignOut} style={{ background: "#fff", color: "#b91c1c", border: "1.5px solid #fecaca", borderRadius: 8, padding: "7px 14px", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Odhlásit</button>
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px", display: "flex", gap: 28 }}>
        <div style={{ width: 240, flexShrink: 0 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: "20px", marginBottom: 12, border: "1px solid #ede8e0", textAlign: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#2d6a4f", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.6rem", margin: "0 auto 10px" }}>🏪</div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.05rem", color: "#1c2b22", marginBottom: 4 }}>{sellerProfile?.name}</div>
            <span style={{ background: sellerProfile?.tier === "premium" ? "#fdf0e6" : "#e8f5ef", color: sellerProfile?.tier === "premium" ? "#e07b39" : "#2d6a4f", border: `1px solid ${sellerProfile?.tier === "premium" ? "#f5c99a" : "#b7d9c7"}`, borderRadius: 20, padding: "2px 10px", fontSize: "0.72rem", fontWeight: 700 }}>
              {sellerProfile?.tier === "premium" ? "⭐ Premium" : "✓ Basic"}
            </span>
          </div>
          <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden", border: "1px solid #ede8e0" }}>
            {SELLER_MENU.map((item, i) => (
              <button key={item.id} onClick={() => setActiveTab(item.id)} style={{ width: "100%", padding: "12px 18px", display: "flex", alignItems: "center", gap: 10, background: activeTab === item.id ? "#e8f5ef" : "#fff", border: "none", borderBottom: i < SELLER_MENU.length - 1 ? "1px solid #f7f4ef" : "none", cursor: "pointer", fontSize: "0.88rem", fontWeight: activeTab === item.id ? 600 : 400, color: activeTab === item.id ? "#2d6a4f" : "#4a5e52", fontFamily: "'DM Sans', sans-serif", textAlign: "left" }}>
                <span>{item.icon}</span>{item.label}
                {item.id === "objednavky" && objednavky.filter(o => o.status === "pending").length > 0 && (
                  <span style={{ marginLeft: "auto", background: "#e07b39", color: "#fff", borderRadius: "50%", width: 18, height: 18, fontSize: "0.65rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {objednavky.filter(o => o.status === "pending").length}
                  </span>
                )}
                {activeTab === item.id && !objednavky.filter(o => o.status === "pending").length && <span style={{ marginLeft: "auto", color: "#2d6a4f" }}>›</span>}
              </button>
            ))}
            <button onClick={handleSignOut} style={{ width: "100%", padding: "12px 18px", display: "flex", alignItems: "center", gap: 10, background: "#fff", border: "none", borderTop: "1px solid #f7f4ef", cursor: "pointer", fontSize: "0.88rem", color: "#b91c1c", fontFamily: "'DM Sans', sans-serif" }}>
              <span>🚪</span> Odhlásit se
            </button>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          {activeTab === "prehled" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                {[
                  { label: "Produkty", value: produkty.length, icon: "🛍️" },
                  { label: "Objednávky", value: objednavky.length, icon: "📦" },
                  { label: "Tržby celkem", value: `${trzbyCelkem.toFixed(0)} Kč`, icon: "💰" },
                ].map(({ label, value, icon }) => (
                  <div key={label} style={{ background: "#fff", borderRadius: 14, padding: "20px", border: "1px solid #ede8e0", textAlign: "center" }}>
                    <div style={{ fontSize: "1.8rem", marginBottom: 8 }}>{icon}</div>
                    <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "#2d6a4f", fontFamily: "'DM Serif Display', serif" }}>{value}</div>
                    <div style={{ fontSize: "0.78rem", color: "#8a9e92", marginTop: 4 }}>{label}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: "#fff", borderRadius: 14, padding: "20px 24px", border: "1px solid #ede8e0" }}>
                <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "#8a9e92", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 14 }}>Přehled tržeb (zaplacené + odeslané + doručené)</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                  <div style={{ textAlign: "center", padding: "12px", background: "#f7f4ef", borderRadius: 10 }}>
                    <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1c2b22" }}>{trzbyCelkem.toFixed(0)} Kč</div>
                    <div style={{ fontSize: "0.72rem", color: "#8a9e92", marginTop: 2 }}>Tržby z produktů</div>
                  </div>
                  <div style={{ textAlign: "center", padding: "12px", background: "#fce4ec", borderRadius: 10 }}>
                    <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#b91c1c" }}>-{trzbyProvize.toFixed(0)} Kč</div>
                    <div style={{ fontSize: "0.72rem", color: "#8a9e92", marginTop: 2 }}>Provize Pet Market (10%)</div>
                  </div>
                  <div style={{ textAlign: "center", padding: "12px", background: "#e8f5e9", borderRadius: 10 }}>
                    <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1b5e20" }}>{trzbyNetto.toFixed(0)} Kč</div>
                    <div style={{ fontSize: "0.72rem", color: "#8a9e92", marginTop: 2 }}>Váš výdělek (netto)</div>
                  </div>
                </div>
              </div>
              <div style={{ background: "#fff", borderRadius: 16, padding: "24px 28px", border: "1px solid #ede8e0" }}>
                <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.2rem", color: "#1c2b22", marginBottom: 16 }}>Poslední objednávky</h2>
                {objednavky.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "30px", color: "#8a9e92" }}>
                    <div style={{ fontSize: "2rem", marginBottom: 8 }}>📦</div>
                    <p>Zatím žádné objednávky.</p>
                  </div>
                ) : objednavky.slice(0, 5).map(o => {
                  const s = statusColor[o.status] || statusColor.pending;
                  return (
                    <div key={o.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 0", borderBottom: "1px solid #f7f4ef" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, color: "#1c2b22", fontSize: "0.9rem" }}>{o.buyer_name || "Zákazník"}</div>
                        <div style={{ fontSize: "0.78rem", color: "#8a9e92" }}>{new Date(o.created_at).toLocaleDateString("cs-CZ")}</div>
                      </div>
                      <div style={{ fontWeight: 700, color: "#2d6a4f" }}>{o.total_price} Kč</div>
                      <span style={{ background: s.bg, color: s.color, borderRadius: 20, padding: "3px 10px", fontSize: "0.72rem", fontWeight: 700 }}>{s.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === "produkty" && (
            <div style={{ background: "#fff", borderRadius: 16, padding: "28px 32px", border: "1px solid #ede8e0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.4rem", color: "#1c2b22", margin: 0 }}>Moje produkty</h2>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setActiveTab("import")} style={{ background: "#f7f4ef", color: "#2d6a4f", border: "1.5px solid #b7d9c7", borderRadius: 8, padding: "8px 14px", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>📥 CSV import</button>
                  <button onClick={() => setActiveTab("pridat")} style={{ background: "#2d6a4f", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>+ Přidat produkt</button>
                </div>
              </div>
              {produkty.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", color: "#8a9e92" }}>
                  <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>🛍️</div>
                  <p>Zatím žádné produkty.</p>
                  <button onClick={() => setActiveTab("pridat")} style={{ background: "#2d6a4f", color: "#fff", border: "none", borderRadius: 8, padding: "10px 24px", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", marginTop: 8 }}>Přidat první produkt</button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {produkty.map(item => (
                    <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px", border: "1px solid #ede8e0", borderRadius: 12 }}>
                      <div style={{ width: 56, height: 56, borderRadius: 10, background: "#e8f5ef", overflow: "hidden", flexShrink: 0 }}>
                        {item.foto_urls?.[0] ? <img src={item.foto_urls[0]} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>📦</div>}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, color: "#1c2b22", marginBottom: 4 }}>{item.title}</div>
                        <div style={{ fontSize: "0.78rem", color: "#8a9e92", display: "flex", gap: 10 }}>
                          <span>🏷️ {item.category}</span>
                          <span>📦 Skladem: {item.stock} ks</span>
                        </div>
                      </div>
                      <div style={{ fontWeight: 700, color: "#2d6a4f", fontSize: "1.05rem", marginRight: 8 }}>{item.price} Kč</div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <button onClick={() => handleToggleActive(item)} style={{ background: item.active ? "#e8f5ef" : "#fce4ec", color: item.active ? "#2d6a4f" : "#b91c1c", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                          {item.active ? "✓ Aktivní" : "✗ Skrytý"}
                        </button>
                        <button onClick={() => handleDeleteProdukt(item.id)} style={{ background: "#fff", color: "#b91c1c", border: "1.5px solid #fecaca", borderRadius: 8, padding: "6px 10px", fontSize: "0.78rem", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>🗑️</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "pridat" && (
            <div style={{ background: "#fff", borderRadius: 16, padding: "28px 32px", border: "1px solid #ede8e0" }}>
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.4rem", color: "#1c2b22", marginBottom: 24 }}>Přidat produkt</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <div><label style={labelStyle}>Název produktu *</label><input style={inputStyle} value={productForm.title} onChange={e => setProductForm(f => ({ ...f, title: e.target.value }))} placeholder="např. Granule pro psy 5kg" /></div>
                <div><label style={labelStyle}>Popis</label><textarea style={{ ...inputStyle, minHeight: 90, resize: "vertical" }} value={productForm.description} onChange={e => setProductForm(f => ({ ...f, description: e.target.value }))} placeholder="Popis produktu..." /></div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div><label style={labelStyle}>Cena (Kč) *</label><input type="number" style={inputStyle} value={productForm.price} onChange={e => setProductForm(f => ({ ...f, price: e.target.value }))} placeholder="0" /></div>
                  <div><label style={labelStyle}>Skladem (ks)</label><input type="number" style={inputStyle} value={productForm.stock} onChange={e => setProductForm(f => ({ ...f, stock: e.target.value }))} min="0" /></div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div><label style={labelStyle}>Kategorie *</label>
                    <select style={{ ...inputStyle, cursor: "pointer" }} value={productForm.category} onChange={e => setProductForm(f => ({ ...f, category: e.target.value }))}>
                      <option value="">Vyber...</option>
                      {KATEGORIE.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div><label style={labelStyle}>Zvíře</label>
                    <select style={{ ...inputStyle, cursor: "pointer" }} value={productForm.animal} onChange={e => setProductForm(f => ({ ...f, animal: e.target.value }))}>
                      <option value="">Vyber...</option>
                      {ZVIRATA.map(a => <option key={a}>{a}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Fotky (max 5)</label>
                  <input type="file" accept="image/*" multiple onChange={e => setProductPhotos(Array.from(e.target.files).slice(0, 5))} style={{ ...inputStyle, padding: "8px 14px" }} />
                  {productPhotos.length > 0 && <p style={{ fontSize: "0.78rem", color: "#8a9e92", marginTop: 6 }}>{productPhotos.length} fotka/fotek vybrána</p>}
                </div>
                {productMsg && <div style={{ background: productMsg.includes("❌") || productMsg.includes("⚠️") ? "#fce4ec" : "#e8f5e9", border: `1px solid ${productMsg.includes("❌") || productMsg.includes("⚠️") ? "#f48fb1" : "#a5d6a7"}`, borderRadius: 10, padding: "10px 14px", fontSize: "0.85rem", color: productMsg.includes("❌") || productMsg.includes("⚠️") ? "#880e4f" : "#1b5e20" }}>{productMsg}</div>}
                <button onClick={handleProductSubmit} disabled={productSaving} style={{ background: productSaving ? "#b5cec0" : "#2d6a4f", color: "#fff", border: "none", borderRadius: 10, padding: "14px", fontSize: "1rem", fontWeight: 600, cursor: productSaving ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                  {productSaving ? "Ukládám..." : "✓ Přidat produkt"}
                </button>
              </div>
            </div>
          )}

          {activeTab === "import" && (
            <div style={{ background: "#fff", borderRadius: 16, padding: "28px 32px", border: "1px solid #ede8e0" }}>
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.4rem", color: "#1c2b22", marginBottom: 8 }}>CSV import produktů</h2>
              <p style={{ color: "#8a9e92", fontSize: "0.88rem", marginBottom: 24 }}>Nahraj CSV soubor s produkty a přidej je hromadně do svého obchodu.</p>
              <div style={{ background: "#e8f5ef", borderRadius: 12, padding: "16px 20px", marginBottom: 20, fontSize: "0.85rem", color: "#2d6a4f" }}>
                <strong>Formát CSV:</strong> název, popis, cena, kategorie, zvíře, skladem<br />
                <span style={{ color: "#4a5e52" }}>Kategorie: Krmivo | Hračky | Obojky a vodítka | Pelíšky | Hygiena | Doplňky | Jiné</span>
              </div>
              <button onClick={() => {
                const csv = "název,popis,cena,kategorie,zvíře,skladem\nGranule pro psy 5kg,Kvalitní granule pro dospělé psy,299,Krmivo,Pes,50\nHračka míček,Gumový míček pro psy,89,Hračky,Pes,30";
                const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a"); a.href = url; a.download = "vzor_produkty.csv"; a.click();
              }} style={{ background: "#f7f4ef", color: "#2d6a4f", border: "1.5px solid #b7d9c7", borderRadius: 10, padding: "10px 20px", fontSize: "0.88rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", marginBottom: 20, display: "inline-block" }}>
                ⬇️ Stáhnout vzorový CSV
              </button>
              <CsvImport user={user} sellerProfile={sellerProfile} onSuccess={() => { fetchProdukty(); setActiveTab("produkty"); }} />
            </div>
          )}

          {activeTab === "objednavky" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
                {[
                  { key: "vse", label: "Všechny", count: objednavky.length },
                  { key: "pending", label: "Čekají", count: objednavky.filter(o => o.status === "pending").length },
                  { key: "paid", label: "Zaplaceno", count: objednavky.filter(o => o.status === "paid").length },
                  { key: "shipped", label: "Odesláno", count: objednavky.filter(o => o.status === "shipped").length },
                  { key: "delivered", label: "Doručeno", count: objednavky.filter(o => o.status === "delivered").length },
                ].map(f => (
                  <button key={f.key} onClick={() => setFilterStatus(f.key)} style={{ background: filterStatus === f.key ? "#2d6a4f" : "#fff", color: filterStatus === f.key ? "#fff" : "#4a5e52", border: `1.5px solid ${filterStatus === f.key ? "#2d6a4f" : "#ede8e0"}`, borderRadius: 10, padding: "10px 8px", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", textAlign: "center" }}>
                    <div style={{ fontSize: "1.1rem", fontWeight: 700 }}>{f.count}</div>
                    <div>{f.label}</div>
                  </button>
                ))}
              </div>

              <div style={{ background: "#fff", borderRadius: 16, padding: "20px 24px", border: "1px solid #ede8e0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.2rem", color: "#1c2b22", margin: 0 }}>
                    Objednávky {filterStatus !== "vse" && `— ${statusColor[filterStatus]?.label}`}
                    <span style={{ fontSize: "0.85rem", fontWeight: 400, color: "#8a9e92", marginLeft: 8 }}>({filteredObjednavky.length})</span>
                  </h2>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ border: "1.5px solid #ede8e0", borderRadius: 8, padding: "6px 10px", fontSize: "0.8rem", fontFamily: "'DM Sans', sans-serif", color: "#1c2b22", background: "#f7f4ef", cursor: "pointer" }} />
                  <span style={{ color: "#8a9e92", fontSize: "0.8rem" }}>–</span>
                  <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ border: "1.5px solid #ede8e0", borderRadius: 8, padding: "6px 10px", fontSize: "0.8rem", fontFamily: "'DM Sans', sans-serif", color: "#1c2b22", background: "#f7f4ef", cursor: "pointer" }} />
                  {(dateFrom || dateTo) && (
                    <button onClick={() => { setDateFrom(""); setDateTo(""); }} style={{ background: "#fce4ec", color: "#b91c1c", border: "none", borderRadius: 8, padding: "6px 10px", fontSize: "0.75rem", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>✕</button>
                  )}
                  <button onClick={exportCSV} style={{ background: "#f7f4ef", color: "#2d6a4f", border: "1.5px solid #b7d9c7", borderRadius: 8, padding: "7px 14px", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                    ⬇️ Export CSV
                  </button>
                </div>
                </div>

                {filteredObjednavky.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px", color: "#8a9e92" }}>
                    <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>📦</div>
                    <p>Žádné objednávky v této kategorii.</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {filteredObjednavky.map(o => {
                      const s = statusColor[o.status] || statusColor.pending;
                      const isExpanded = expandedOrder === o.id;
                      return (
                        <div key={o.id} style={{ border: "1px solid #ede8e0", borderRadius: 12, overflow: "hidden" }}>
                          <div onClick={() => setExpandedOrder(isExpanded ? null : o.id)} style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", cursor: "pointer", background: isExpanded ? "#f7faf8" : "#fff" }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 700, color: "#1c2b22", marginBottom: 2 }}>{o.buyer_name || "Zákazník"}</div>
                              <div style={{ fontSize: "0.78rem", color: "#8a9e92" }}>
                                #{o.id.slice(0, 8).toUpperCase()} · {new Date(o.created_at).toLocaleDateString("cs-CZ")}
                              </div>
                            </div>
                            <div style={{ fontWeight: 700, color: "#2d6a4f", fontSize: "1rem" }}>{o.total_price} Kč</div>
                            <span style={{ background: s.bg, color: s.color, borderRadius: 20, padding: "4px 12px", fontSize: "0.72rem", fontWeight: 700 }}>{s.label}</span>
                            <span style={{ color: "#8a9e92", fontSize: "1rem" }}>{isExpanded ? "▲" : "▼"}</span>
                          </div>

                          {isExpanded && (
                            <div style={{ borderTop: "1px solid #ede8e0", padding: "16px 20px", background: "#fafaf8" }}>
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 14 }}>
                                <div style={{ fontSize: "0.82rem" }}>
                                  <div style={{ fontWeight: 600, color: "#1c2b22", marginBottom: 6 }}>📋 Kontakt</div>
                                  <div style={{ color: "#4a5e52" }}>{o.buyer_email}</div>
                                  <div style={{ color: "#4a5e52" }}>{o.buyer_phone}</div>
                                  <div style={{ color: "#4a5e52", marginTop: 4 }}>📍 {o.buyer_address}</div>
                                </div>
                                <div style={{ fontSize: "0.82rem" }}>
                                  <div style={{ fontWeight: 600, color: "#1c2b22", marginBottom: 6 }}>🚚 Doprava</div>
                                  <div style={{ color: "#4a5e52" }}>{o.shipping_name}</div>
                                  <div style={{ color: "#4a5e52" }}>{o.shipping_price} Kč</div>
                                </div>
                              </div>
                              <div style={{ background: "#fff", borderRadius: 8, padding: "12px 14px", marginBottom: 14, border: "1px solid #ede8e0" }}>
                                {o.order_items?.map(item => (
                                  <div key={item.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "#1c2b22", padding: "4px 0", borderBottom: "1px solid #f7f4ef" }}>
                                    <span>{item.title} × {item.quantity}</span>
                                    <span style={{ fontWeight: 600 }}>{(item.price * item.quantity).toFixed(0)} Kč</span>
                                  </div>
                                ))}
                                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, color: "#2d6a4f", fontSize: "0.9rem", marginTop: 8 }}>
                                  <span>Celkem</span>
                                  <span>{o.total_price} Kč</span>
                                </div>
                              </div>
                              <div>
                                <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "#8a9e92", textTransform: "uppercase", marginBottom: 8 }}>Změnit status</div>
                                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                  {["pending", "paid", "shipped", "delivered", "cancelled"].map(status => (
                                    <button key={status} onClick={() => handleUpdateStatus(o.id, status)}
                                      style={{ background: o.status === status ? "#2d6a4f" : "#f7f4ef", color: o.status === status ? "#fff" : "#4a5e52", border: `1px solid ${o.status === status ? "#2d6a4f" : "#ede8e0"}`, borderRadius: 8, padding: "6px 12px", fontSize: "0.72rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                                      {statusColor[status]?.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "doprava" && (
            <div style={{ background: "#fff", borderRadius: 16, padding: "28px 32px", border: "1px solid #ede8e0" }}>
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.4rem", color: "#1c2b22", marginBottom: 8 }}>Nastavení dopravy</h2>
              <p style={{ color: "#8a9e92", fontSize: "0.88rem", marginBottom: 24 }}>Nastav dopravce a ceny které nabízíš zákazníkům. Cena dopravy jde celá tobě.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
                {doprava.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "20px", color: "#8a9e92", background: "#f7f4ef", borderRadius: 10 }}>Zatím žádní dopravci.</div>
                ) : doprava.map(d => (
                  <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", border: "1px solid #ede8e0", borderRadius: 10 }}>
                    <span style={{ fontSize: "1.2rem" }}>🚚</span>
                    <div style={{ flex: 1, fontWeight: 600, color: "#1c2b22" }}>{d.name}</div>
                    <div style={{ fontWeight: 700, color: "#2d6a4f" }}>{d.price} Kč</div>
                    <button onClick={() => handleDeleteDoprava(d.id)} style={{ background: "#fff", color: "#b91c1c", border: "1.5px solid #fecaca", borderRadius: 8, padding: "5px 10px", fontSize: "0.78rem", cursor: "pointer" }}>🗑️</button>
                  </div>
                ))}
              </div>
              <div style={{ background: "#f7f4ef", borderRadius: 12, padding: "20px" }}>
                <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: "#1c2b22", marginBottom: 14 }}>Přidat dopravce</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 12, alignItems: "end" }}>
                  <div><label style={labelStyle}>Název dopravce</label><input style={inputStyle} value={dopravaNova.name} onChange={e => setDopravaNova(d => ({ ...d, name: e.target.value }))} placeholder="např. Zásilkovna" /></div>
                  <div><label style={labelStyle}>Cena (Kč)</label><input type="number" style={inputStyle} value={dopravaNova.price} onChange={e => setDopravaNova(d => ({ ...d, price: e.target.value }))} placeholder="0" /></div>
                  <button onClick={handleAddDoprava} disabled={dopravaSaving} style={{ background: "#2d6a4f", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap" }}>+ Přidat</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "profil" && (
            <div style={{ background: "#fff", borderRadius: 16, padding: "28px 32px", border: "1px solid #ede8e0" }}>
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.4rem", color: "#1c2b22", marginBottom: 24 }}>Profil obchodu</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {[
                  { label: "Název obchodu", value: sellerProfile?.name },
                  { label: "IČO", value: sellerProfile?.ico },
                  { label: "Adresa", value: sellerProfile?.address },
                  { label: "Město", value: sellerProfile?.city },
                  { label: "Telefon", value: sellerProfile?.phone },
                  { label: "Web", value: sellerProfile?.web },
                  { label: "Tier", value: sellerProfile?.tier === "premium" ? "⭐ Premium" : "✓ Basic" },
                ].map(({ label, value }) => (
                  <div key={label} style={{ borderBottom: "1px solid #f7f4ef", paddingBottom: 14 }}>
                    <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "#8a9e92", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{label}</div>
                    <div style={{ color: "#1c2b22", fontSize: "0.95rem" }}>{value || "—"}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}