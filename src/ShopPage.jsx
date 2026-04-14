import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabase";
import { useAuth } from "./useAuth";

const KATEGORIE = [
  { id: "vse", label: "Vše", icon: "🐾" },
  { id: "Krmivo", label: "Krmivo", icon: "🦴" },
  { id: "Hračky", label: "Hračky", icon: "🧸" },
  { id: "Obojky a vodítka", label: "Obojky & vodítka", icon: "🦮" },
  { id: "Pelíšky", label: "Pelíšky", icon: "🛏️" },
  { id: "Hygiena", label: "Hygiena", icon: "🧴" },
  { id: "Doplňky", label: "Doplňky", icon: "✨" },
  { id: "Jiné", label: "Jiné", icon: "📦" },
];

const ZVIRATA = [
  { id: "vse", label: "Všechna zvířata" },
  { id: "Pes", label: "🐕 Pes" },
  { id: "Kočka", label: "🐈 Kočka" },
  { id: "Hlodavec", label: "🐹 Hlodavec" },
  { id: "Pták", label: "🐦 Pták" },
  { id: "Ryba", label: "🐠 Ryba" },
];

function ProductCard({ product, onOpen, onSellerClick }) {
  return (
    <div onClick={() => onOpen(product)} style={{ background: "#fff", borderRadius: 16, border: "1.5px solid #ede8e0", boxShadow: "0 1px 4px rgba(44,80,58,0.07)", cursor: "pointer", overflow: "hidden", transition: "transform 0.2s, box-shadow 0.2s" }}
      onMouseOver={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(44,80,58,0.14)"; }}
      onMouseOut={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 1px 4px rgba(44,80,58,0.07)"; }}>
      <div style={{ height: 180, background: "linear-gradient(145deg, #f2faf6, #f7f4ef)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
        {product.foto_urls?.[0]
          ? <img src={product.foto_urls[0]} alt={product.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <span style={{ fontSize: "3.5rem" }}>📦</span>}
        {product.stock === 0 && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#fff", fontWeight: 700, fontSize: "0.9rem" }}>Vyprodáno</span>
          </div>
        )}
      </div>
      <div style={{ padding: "14px 16px 16px" }}>
        <div style={{ fontSize: "0.72rem", color: "#8a9e92", marginBottom: 4, fontWeight: 500 }}>
          <span onClick={e => { e.stopPropagation(); onSellerClick(product.seller_id, product.seller_name); }} style={{ cursor: "pointer", color: "#2d6a4f", fontWeight: 600, textDecoration: "underline" }}>
            🏪 {product.seller_name}
          </span>
        </div>
        <div style={{ fontWeight: 600, fontSize: "0.95rem", color: "#1c2b22", lineHeight: 1.35, marginBottom: 10, minHeight: 40 }}>{product.title}</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "1.2rem", fontWeight: 700, color: "#2d6a4f", fontFamily: "'DM Serif Display', serif" }}>{product.price} Kč</span>
          <span style={{ fontSize: "0.72rem", background: "#e8f5ef", color: "#2d6a4f", borderRadius: 20, padding: "2px 8px", fontWeight: 600 }}>
            {product.stock > 0 ? `${product.stock} ks` : "Vyprodáno"}
          </span>
        </div>
      </div>
    </div>
  );
}

function ProductModal({ product, onClose, user, onAuthRequired }) {
  const [fotoIdx, setFotoIdx] = useState(0);
  if (!product) return null;
  const fotos = product.foto_urls?.length > 0 ? product.foto_urls : null;

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(28,43,34,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(5px)" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 22, maxWidth: 540, width: "100%", maxHeight: "92vh", overflowY: "auto", boxShadow: "0 12px 40px rgba(44,80,58,0.14)" }}>
        <div style={{ height: 320, background: "linear-gradient(145deg, #f2faf6, #f7f4ef)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", borderRadius: "22px 22px 0 0", overflow: "hidden" }}>
          {fotos ? <img src={fotos[fotoIdx]} alt={product.title} style={{ width: "100%", height: "100%", objectFit: "contain" }} /> : <span style={{ fontSize: "6rem" }}>📦</span>}
          {fotos && fotos.length > 1 && <>
            <button onClick={e => { e.stopPropagation(); setFotoIdx(i => (i - 1 + fotos.length) % fotos.length); }} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.45)", border: "none", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", fontSize: "1.2rem", color: "#fff" }}>‹</button>
            <button onClick={e => { e.stopPropagation(); setFotoIdx(i => (i + 1) % fotos.length); }} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.45)", border: "none", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", fontSize: "1.2rem", color: "#fff" }}>›</button>
          </>}
          <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, background: "rgba(255,255,255,0.9)", border: "none", borderRadius: "50%", width: 38, height: 38, cursor: "pointer", fontSize: "1.1rem", color: "#4a5e52", fontWeight: 700 }}>✕</button>
        </div>
        <div style={{ padding: "24px 26px 28px" }}>
          <div style={{ fontSize: "0.78rem", color: "#2d6a4f", fontWeight: 600, marginBottom: 8 }}>🏪 {product.seller_name}</div>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.3rem", color: "#1c2b22", marginBottom: 12 }}>{product.title}</h2>
          <div style={{ fontSize: "2rem", fontWeight: 700, color: "#2d6a4f", fontFamily: "'DM Serif Display', serif", marginBottom: 16 }}>{product.price} Kč</div>
          {product.description && <p style={{ color: "#4a5e52", fontSize: "0.92rem", lineHeight: 1.65, marginBottom: 18 }}>{product.description}</p>}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
            {[`🏷️ ${product.category}`, product.animal && `🐾 ${product.animal}`, `📦 Skladem: ${product.stock} ks`].filter(Boolean).map(tag => (
              <span key={tag} style={{ background: "#f7f4ef", border: "1px solid #ede8e0", borderRadius: 20, padding: "5px 12px", fontSize: "0.78rem", color: "#4a5e52" }}>{tag}</span>
            ))}
          </div>
          <button onClick={() => { if (!user) { onClose(); onAuthRequired(); return; } alert("Košík bude brzy dostupný! 🛒"); }}
            style={{ width: "100%", background: product.stock === 0 ? "#b5cec0" : "#2d6a4f", color: "#fff", border: "none", borderRadius: 12, padding: "14px", fontSize: "1rem", fontWeight: 600, cursor: product.stock === 0 ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif" }}
            disabled={product.stock === 0}>
            {product.stock === 0 ? "Vyprodáno" : "🛒 Přidat do košíku"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ShopPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState("vse");
  const [animal, setAnimal] = useState("vse");
  const [search, setSearch] = useState("");
  const [maxPrice, setMaxPrice] = useState(5000);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const { data } = await supabase.from("products").select("*").eq("active", true).order("created_at", { ascending: false });
    if (data) setProducts(data);
    setLoading(false);
  };

  const handleSellerClick = (sellerId, sellerName) => {
    setSelectedSeller({ id: sellerId, name: sellerName });
    setCat("vse");
    setAnimal("vse");
    setSearch("");
  };

  const filtered = products
    .filter(p => !selectedSeller || p.seller_id === selectedSeller.id)
    .filter(p => cat === "vse" || p.category === cat)
    .filter(p => animal === "vse" || p.animal === animal)
    .filter(p => p.price <= maxPrice)
    .filter(p => !search || p.title.toLowerCase().includes(search.toLowerCase()));

  const sellers = [...new Map(products.map(p => [p.seller_id, { id: p.seller_id, name: p.seller_name }])).values()];

  return (
    <div style={{ minHeight: "100vh", background: "#f7f4ef", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600;700&display=swap');`}</style>

      <nav style={{ background: "#fff", borderBottom: "1px solid #ede8e0", height: 64, display: "flex", alignItems: "center", padding: "0 32px", gap: 16, position: "sticky", top: 0, zIndex: 100, boxShadow: "0 1px 12px rgba(44,80,58,0.07)" }}>
        <button onClick={() => navigate("/")} style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer" }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: "#2d6a4f", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>🐾</div>
          <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.15rem", color: "#1c2b22" }}>Pet Market</span>
        </button>
        <div style={{ flex: 1, position: "relative" }}>
          <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", opacity: 0.45 }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Hledat produkty..." style={{ width: "100%", border: "1.5px solid #ede8e0", borderRadius: 30, padding: "9px 14px 9px 38px", fontSize: "0.9rem", outline: "none", background: "#f7f4ef", fontFamily: "'DM Sans', sans-serif" }} />
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => navigate("/")} style={{ background: "#fff", color: "#4a5e52", border: "1.5px solid #ede8e0", borderRadius: 8, padding: "8px 16px", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>← Zpět na bazar</button>
          {user ? (
            <button onClick={() => navigate("/profil")} style={{ background: "#2d6a4f", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>👤 Profil</button>
          ) : (
            <button onClick={() => setShowAuth(true)} style={{ background: "#2d6a4f", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Přihlásit se</button>
          )}
        </div>
      </nav>

      <div style={{ background: "linear-gradient(135deg, #2d6a4f 0%, #3a7d60 100%)", padding: "32px 32px 0" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", textAlign: "center", paddingBottom: 24 }}>
          <h1 style={{ color: "#fff", fontSize: "clamp(1.4rem, 3vw, 2rem)", marginBottom: 8, fontFamily: "'DM Serif Display', serif" }}>Partnerští prodejci</h1>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "0.9rem", marginBottom: 20 }}>Nové zboží od ověřených prodejců přímo pro tvého mazlíčka</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            {[["🛍️", `${products.length} produktů`], ["🏪", `${sellers.length} prodejců`], ["✓", "Ověření prodejci"]].map(([icon, label]) => (
              <div key={label} style={{ background: "rgba(255,255,255,0.12)", borderRadius: 8, padding: "4px 12px", display: "flex", alignItems: "center", gap: 6, color: "#fff", fontSize: "0.78rem", fontWeight: 600 }}>{icon} {label}</div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ background: "#fff", borderBottom: "1px solid #ede8e0", padding: "14px 24px" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto" }}>
          {selectedSeller && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, background: "#e8f5ef", borderRadius: 10, padding: "8px 14px" }}>
              <span style={{ fontSize: "0.88rem", fontWeight: 600, color: "#2d6a4f" }}>🏪 {selectedSeller.name}</span>
              <button onClick={() => setSelectedSeller(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#2d6a4f", fontSize: "0.8rem", fontWeight: 600, marginLeft: "auto" }}>✕ Zobrazit vše</button>
            </div>
          )}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
            {KATEGORIE.map(c => (
              <button key={c.id} onClick={() => setCat(c.id)} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 14px", borderRadius: 30, fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", border: cat === c.id ? "none" : "1.5px solid #ede8e0", background: cat === c.id ? "#2d6a4f" : "#fff", color: cat === c.id ? "#fff" : "#4a5e52", fontFamily: "'DM Sans', sans-serif" }}>
                {c.icon} {c.label}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            {ZVIRATA.map(a => (
              <button key={a.id} onClick={() => setAnimal(a.id)} style={{ display: "inline-flex", alignItems: "center", padding: "5px 13px", borderRadius: 30, fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", border: animal === a.id ? "none" : "1.5px solid #ede8e0", background: animal === a.id ? "#1c2b22" : "#fff", color: animal === a.id ? "#fff" : "#1c2b22", fontFamily: "'DM Sans', sans-serif" }}>
                {a.label}
              </button>
            ))}
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: "0.78rem", color: "#8a9e92", whiteSpace: "nowrap" }}>Do <strong style={{ color: "#2d6a4f" }}>{maxPrice} Kč</strong></span>
              <input type="range" min={50} max={10000} step={50} value={maxPrice} onChange={e => setMaxPrice(+e.target.value)} style={{ width: 90, accentColor: "#2d6a4f", cursor: "pointer" }} />
              <span style={{ fontSize: "0.8rem", color: "#8a9e92", whiteSpace: "nowrap" }}>{filtered.length} produktů</span>
            </div>
          </div>
        </div>
      </div>

      {sellers.length > 0 && !selectedSeller && (
        <div style={{ maxWidth: 1180, margin: "20px auto 0", padding: "0 24px" }}>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.1rem", color: "#1c2b22", marginBottom: 12 }}>Naši prodejci</h2>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {sellers.map(seller => (
              <button key={seller.id} onClick={() => handleSellerClick(seller.id, seller.name)} style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", border: "1.5px solid #ede8e0", borderRadius: 30, padding: "8px 16px", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600, color: "#1c2b22", fontFamily: "'DM Sans', sans-serif" }}
                onMouseOver={e => { e.currentTarget.style.borderColor = "#2d6a4f"; e.currentTarget.style.color = "#2d6a4f"; }}
                onMouseOut={e => { e.currentTarget.style.borderColor = "#ede8e0"; e.currentTarget.style.color = "#1c2b22"; }}>
                <span style={{ width: 28, height: 28, borderRadius: "50%", background: "#2d6a4f", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem" }}>🏪</span>
                {seller.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <main style={{ maxWidth: 1180, margin: "24px auto", padding: "0 24px 48px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px", color: "#8a9e92" }}>
            <div style={{ fontSize: "2rem", marginBottom: 12 }}>🛍️</div>
            <p>Načítám produkty...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px", color: "#8a9e92" }}>
            <div style={{ fontSize: "3rem", marginBottom: 12 }}>🔍</div>
            <h3 style={{ fontFamily: "'DM Serif Display', serif", color: "#4a5e52", marginBottom: 8 }}>Žádné produkty nenalezeny</h3>
            <p>Zkus upravit filtry.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 20 }}>
            {filtered.map(product => (
              <ProductCard key={product.id} product={product} onOpen={setSelectedProduct} onSellerClick={handleSellerClick} />
            ))}
          </div>
        )}
      </main>

      {selectedProduct && <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} user={user} onAuthRequired={() => setShowAuth(true)} />}

      <footer style={{ background: "#1c2b22", color: "rgba(255,255,255,0.5)", padding: "24px", textAlign: "center", fontSize: "0.8rem" }}>
        <span style={{ fontFamily: "'DM Serif Display', serif", color: "rgba(255,255,255,0.8)", fontSize: "1rem" }}>Pet Market</span>
        {" "}· Tržiště pro mazlíčky · Celá ČR · {new Date().getFullYear()}
      </footer>
    </div>
  );
}