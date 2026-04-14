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

function ProductCard({ product, onOpen, onSellerClick, onAddToCart, addedToCart }) {
  return (
    <div style={{ background: "#fff", borderRadius: 16, border: "1.5px solid #ede8e0", boxShadow: "0 1px 4px rgba(44,80,58,0.07)", overflow: "hidden", transition: "transform 0.2s, box-shadow 0.2s" }}
      onMouseOver={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(44,80,58,0.14)"; }}
      onMouseOut={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 1px 4px rgba(44,80,58,0.07)"; }}>
      <div onClick={() => onOpen(product)} style={{ cursor: "pointer" }}>
        <div style={{ height: 180, background: "linear-gradient(145deg, #f2faf6, #f7f4ef)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
          {product.foto_urls?.[0]
            ? <img src={product.foto_urls[0]} alt={product.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <span style={{ fontSize: "3.5rem" }}>📦</span>}
          {product.stock === 0 && (
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#fff", fontWeight: 700, fontSize: "0.9rem" }}>Vyprodáno</span>
            </div>
          )}
          {addedToCart && (
            <div style={{ position: "absolute", inset: 0, background: "rgba(45,106,79,0.85)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#fff", fontWeight: 700, fontSize: "1rem" }}>✓ Přidáno!</span>
            </div>
          )}
        </div>
        <div style={{ padding: "14px 16px 10px" }}>
          <div style={{ fontSize: "0.72rem", marginBottom: 4 }}>
            <span onClick={e => { e.stopPropagation(); onSellerClick(product.seller_id, product.seller_name); }} style={{ cursor: "pointer", color: "#2d6a4f", fontWeight: 600, textDecoration: "underline" }}>
              🏪 {product.seller_name}
            </span>
          </div>
          <div style={{ fontWeight: 600, fontSize: "0.95rem", color: "#1c2b22", lineHeight: 1.35, marginBottom: 10, minHeight: 40 }}>{product.title}</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: "1.2rem", fontWeight: 700, color: "#2d6a4f", fontFamily: "'DM Serif Display', serif" }}>{product.price} Kč</span>
            <span style={{ fontSize: "0.72rem", background: "#e8f5ef", color: "#2d6a4f", borderRadius: 20, padding: "2px 8px", fontWeight: 600 }}>
              {product.stock > 0 ? `${product.stock} ks` : "Vyprodáno"}
            </span>
          </div>
        </div>
      </div>
      <div style={{ padding: "0 16px 16px" }}>
        <button onClick={() => onAddToCart(product)} disabled={product.stock === 0}
          style={{ width: "100%", background: product.stock === 0 ? "#b5cec0" : addedToCart ? "#1b5e20" : "#2d6a4f", color: "#fff", border: "none", borderRadius: 10, padding: "10px", fontSize: "0.88rem", fontWeight: 600, cursor: product.stock === 0 ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif", transition: "background 0.2s" }}>
          {product.stock === 0 ? "Vyprodáno" : addedToCart ? "✓ V košíku" : "🛒 Do košíku"}
        </button>
      </div>
    </div>
  );
}

function ProductModal({ product, onClose, onAddToCart, isInCart }) {
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
          <button onClick={() => { onAddToCart(product); onClose(); }} disabled={product.stock === 0}
            style={{ width: "100%", background: product.stock === 0 ? "#b5cec0" : isInCart ? "#1b5e20" : "#2d6a4f", color: "#fff", border: "none", borderRadius: 12, padding: "14px", fontSize: "1rem", fontWeight: 600, cursor: product.stock === 0 ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif" }}>
            {product.stock === 0 ? "Vyprodáno" : isInCart ? "✓ Přidat další kus" : "🛒 Přidat do košíku"}
          </button>
        </div>
      </div>
    </div>
  );
}

function OrderSuccessModal({ orderNumber, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(28,43,34,0.6)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(5px)" }}>
      <div style={{ background: "#fff", borderRadius: 22, maxWidth: 460, width: "100%", padding: "40px 36px", textAlign: "center", boxShadow: "0 12px 40px rgba(44,80,58,0.2)" }}>
        <div style={{ fontSize: "3.5rem", marginBottom: 16 }}>🎉</div>
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.6rem", color: "#1c2b22", marginBottom: 12 }}>Objednávka přijata!</h2>
        <p style={{ color: "#4a5e52", fontSize: "0.95rem", lineHeight: 1.65, marginBottom: 20 }}>
          Tvoje objednávka byla úspěšně odeslána. Prodejce tě brzy kontaktuje s dalšími instrukcemi.
        </p>
        <div style={{ background: "#e8f5ef", borderRadius: 12, padding: "14px 20px", marginBottom: 24 }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#8a9e92", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Číslo objednávky</div>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.1rem", color: "#2d6a4f", fontWeight: 700 }}>{orderNumber}</div>
        </div>
        <div style={{ background: "#fff8e1", borderRadius: 10, padding: "12px 16px", marginBottom: 24, fontSize: "0.85rem", color: "#e65100", textAlign: "left" }}>
          💳 Platba probíhá při doručení nebo převodem. Prodejce tě kontaktuje na email s platebními instrukcemi.
        </div>
        <button onClick={onClose} style={{ width: "100%", background: "#2d6a4f", color: "#fff", border: "none", borderRadius: 12, padding: "14px", fontSize: "1rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
          Pokračovat v nákupu
        </button>
      </div>
    </div>
  );
}

function CartPanel({ cart, onClose, onUpdateQty, onRemove, shippingOptions, user, onOrderSuccess }) {
  const [step, setStep] = useState("cart");
  const [selectedShipping, setSelectedShipping] = useState(null);
  const [form, setForm] = useState({ name: "", email: user?.email || "", phone: "", address: "", city: "", zip: "" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const cartBySeller = cart.reduce((acc, item) => {
    if (!acc[item.seller_id]) acc[item.seller_id] = { seller_name: item.seller_name, seller_id: item.seller_id, items: [] };
    acc[item.seller_id].items.push(item);
    return acc;
  }, {});

  const sellerCount = Object.keys(cartBySeller).length;
  const totalProducts = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const shippingPrice = selectedShipping?.price || 0;
  const total = totalProducts + shippingPrice;

  const inputStyle = { width: "100%", border: "1.5px solid #ede8e0", borderRadius: 10, padding: "10px 14px", fontSize: "0.88rem", outline: "none", fontFamily: "'DM Sans', sans-serif", background: "#f7f4ef", boxSizing: "border-box", color: "#1c2b22" };
  const labelStyle = { fontSize: "0.72rem", fontWeight: 600, color: "#8a9e92", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 5 };

  const handleOrder = async () => {
    if (!form.name || !form.email || !form.phone || !form.address || !form.city) {
      setMsg("⚠️ Vyplň všechna pole."); return;
    }
    setSaving(true); setMsg("");
    try {
      let lastOrderId = null;
      for (const sellerId of Object.keys(cartBySeller)) {
        const sellerCart = cartBySeller[sellerId];
        const orderTotal = sellerCart.items.reduce((s, i) => s + i.price * i.qty, 0);
        const { data: order, error } = await supabase.from("orders").insert({
          buyer_id: user?.id || null,
          seller_id: sellerId,
          buyer_name: form.name,
          buyer_email: form.email,
          buyer_phone: form.phone,
          buyer_address: `${form.address}, ${form.city} ${form.zip}`,
          shipping_option_id: selectedShipping?.id === "osobni" ? null : selectedShipping?.id || null,
          shipping_name: selectedShipping?.name || "Osobní odběr",
          shipping_price: selectedShipping?.price || 0,
          total_products: orderTotal,
          total_price: orderTotal + (selectedShipping?.price || 0),
          status: "pending",
        }).select().single();
        if (error) throw error;
        lastOrderId = order.id;
        for (const item of sellerCart.items) {
          await supabase.from("order_items").insert({
            order_id: order.id,
            product_id: item.id,
            title: item.title,
            price: item.price,
            quantity: item.qty,
          });
          await supabase.from("products").update({ stock: item.stock - item.qty }).eq("id", item.id);
        }
      }
      onOrderSuccess(lastOrderId);
    } catch (err) { setMsg("❌ Chyba: " + err.message); }
    setSaving(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex" }}>
      <div onClick={onClose} style={{ flex: 1, background: "rgba(28,43,34,0.4)", backdropFilter: "blur(3px)" }} />
      <div style={{ width: 420, background: "#fff", boxShadow: "-4px 0 40px rgba(0,0,0,0.15)", display: "flex", flexDirection: "column", overflowY: "auto" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #ede8e0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.3rem", color: "#1c2b22", margin: 0 }}>
            {step === "cart" && "🛒 Košík"}
            {step === "shipping" && "🚚 Doprava"}
            {step === "info" && "📋 Kontaktní údaje"}
            {step === "confirm" && "✅ Shrnutí"}
          </h2>
          <button onClick={onClose} style={{ background: "#f7f4ef", border: "none", borderRadius: "50%", width: 34, height: 34, cursor: "pointer", fontSize: "1rem", color: "#4a5e52", fontWeight: 700 }}>✕</button>
        </div>

        <div style={{ flex: 1, padding: "20px 24px", overflowY: "auto" }}>
          {step === "cart" && (
            <>
              {cart.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "#8a9e92" }}>
                  <div style={{ fontSize: "3rem", marginBottom: 12 }}>🛒</div>
                  <p>Košík je prázdný</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {sellerCount > 1 && (
                    <div style={{ background: "#fff8e1", border: "1px solid #f5c99a", borderRadius: 10, padding: "12px 14px", fontSize: "0.85rem", color: "#e65100" }}>
                      ⚠️ Máš zboží od {sellerCount} různých prodejců. Doprava se účtuje zvlášť za každého prodejce.
                    </div>
                  )}
                  {Object.values(cartBySeller).map(seller => (
                    <div key={seller.seller_id}>
                      {sellerCount > 1 && (
                        <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#2d6a4f", marginBottom: 8, padding: "4px 0", borderBottom: "1px solid #e8f5ef" }}>
                          🏪 {seller.seller_name}
                        </div>
                      )}
                      {seller.items.map(item => (
                        <div key={item.id} style={{ display: "flex", gap: 12, padding: "12px", border: "1px solid #ede8e0", borderRadius: 12, marginBottom: 8 }}>
                          <div style={{ width: 56, height: 56, borderRadius: 8, background: "#e8f5ef", overflow: "hidden", flexShrink: 0 }}>
                            {item.foto_urls?.[0] ? <img src={item.foto_urls[0]} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>📦</div>}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: "0.88rem", color: "#1c2b22", marginBottom: 4 }}>{item.title}</div>
                            <div style={{ fontSize: "0.75rem", color: "#8a9e92", marginBottom: 8 }}>🏪 {item.seller_name}</div>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <button onClick={() => onUpdateQty(item.id, item.qty - 1)} style={{ width: 26, height: 26, borderRadius: "50%", border: "1px solid #ede8e0", background: "#fff", color: "#1c2b22", cursor: "pointer", fontSize: "0.9rem", display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                                <span style={{ fontSize: "0.88rem", fontWeight: 600, minWidth: 20, textAlign: "center" }}>{item.qty}</span>
                                <button onClick={() => onUpdateQty(item.id, item.qty + 1)} disabled={item.qty >= item.stock} style={{ width: 26, height: 26, borderRadius: "50%", border: "1px solid #ede8e0", background: "#fff", color: "#1c2b22", cursor: item.qty >= item.stock ? "not-allowed" : "pointer", fontSize: "0.9rem", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                              </div>
                              <span style={{ fontWeight: 700, color: "#2d6a4f", fontSize: "0.95rem" }}>{item.price * item.qty} Kč</span>
                              <button onClick={() => onRemove(item.id)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "#b91c1c", fontSize: "0.8rem" }}>🗑️</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                  <div style={{ borderTop: "1px solid #ede8e0", paddingTop: 14, display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: "1.05rem", color: "#1c2b22" }}>
                    <span>Celkem produkty</span>
                    <span>{totalProducts} Kč</span>
                  </div>
                </div>
              )}
            </>
          )}

          {step === "shipping" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <p style={{ fontSize: "0.88rem", color: "#8a9e92", marginBottom: 8 }}>Vyber způsob doručení:</p>
              {shippingOptions.length === 0 ? (
                <div style={{ background: "#f7f4ef", borderRadius: 10, padding: "16px", textAlign: "center", color: "#8a9e92", fontSize: "0.88rem" }}>
                  Prodejce zatím nemá nastavenou dopravu.
                </div>
              ) : shippingOptions.map(opt => (
                <div key={opt.id} onClick={() => setSelectedShipping(opt)} style={{ padding: "14px 16px", border: `2px solid ${selectedShipping?.id === opt.id ? "#2d6a4f" : "#ede8e0"}`, borderRadius: 12, cursor: "pointer", background: selectedShipping?.id === opt.id ? "#e8f5ef" : "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontWeight: 600, color: "#1c2b22", fontSize: "0.9rem" }}>🚚 {opt.name}</div>
                  <div style={{ fontWeight: 700, color: "#2d6a4f" }}>{opt.price} Kč</div>
                </div>
              ))}
              <div onClick={() => setSelectedShipping({ id: "osobni", name: "Osobní odběr", price: 0 })} style={{ padding: "14px 16px", border: `2px solid ${selectedShipping?.id === "osobni" ? "#2d6a4f" : "#ede8e0"}`, borderRadius: 12, cursor: "pointer", background: selectedShipping?.id === "osobni" ? "#e8f5ef" : "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontWeight: 600, color: "#1c2b22", fontSize: "0.9rem" }}>🤝 Osobní odběr</div>
                <div style={{ fontWeight: 700, color: "#2d6a4f" }}>Zdarma</div>
              </div>
            </div>
          )}

          {step === "info" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div><label style={labelStyle}>Jméno a příjmení *</label><input style={inputStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Jana Nováková" /></div>
              <div><label style={labelStyle}>Email *</label><input type="email" style={inputStyle} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="jana@email.cz" /></div>
              <div><label style={labelStyle}>Telefon *</label><input style={inputStyle} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+420 777 888 999" /></div>
              <div><label style={labelStyle}>Ulice a číslo popisné *</label><input style={inputStyle} value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Hlavní 123" /></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div><label style={labelStyle}>Město *</label><input style={inputStyle} value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="Praha" /></div>
                <div><label style={labelStyle}>PSČ</label><input style={inputStyle} value={form.zip} onChange={e => setForm(f => ({ ...f, zip: e.target.value }))} placeholder="110 00" /></div>
              </div>
              {msg && <div style={{ color: "#b91c1c", fontSize: "0.85rem" }}>{msg}</div>}
            </div>
          )}

          {step === "confirm" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ background: "#f7f4ef", borderRadius: 12, padding: "16px" }}>
                <div style={{ fontWeight: 700, color: "#1c2b22", marginBottom: 10, fontSize: "0.9rem" }}>📋 Shrnutí objednávky</div>
                {cart.map(item => (
                  <div key={item.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "#4a5e52", padding: "4px 0" }}>
                    <span>{item.title} × {item.qty}</span>
                    <span style={{ fontWeight: 600 }}>{item.price * item.qty} Kč</span>
                  </div>
                ))}
                <div style={{ borderTop: "1px solid #ede8e0", marginTop: 8, paddingTop: 8, display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "#8a9e92" }}>
                  <span>🚚 {selectedShipping?.name}</span>
                  <span>{selectedShipping?.price || 0} Kč</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, color: "#2d6a4f", fontSize: "1rem", marginTop: 6 }}>
                  <span>Celkem</span>
                  <span>{total} Kč</span>
                </div>
              </div>
              <div style={{ background: "#f7f4ef", borderRadius: 12, padding: "16px", fontSize: "0.85rem", color: "#4a5e52" }}>
                <div style={{ fontWeight: 700, color: "#1c2b22", marginBottom: 8 }}>📍 Doručení</div>
                <div>{form.name}</div>
                <div>{form.address}, {form.city} {form.zip}</div>
                <div>{form.phone}</div>
                <div>{form.email}</div>
              </div>
              <div style={{ background: "#fff8e1", borderRadius: 10, padding: "12px 14px", fontSize: "0.82rem", color: "#e65100" }}>
                💳 Platba při doručení nebo převodem — prodejce tě kontaktuje na email.
              </div>
              {msg && <div style={{ color: "#b91c1c", fontSize: "0.85rem" }}>{msg}</div>}
            </div>
          )}
        </div>

        <div style={{ padding: "16px 24px", borderTop: "1px solid #ede8e0", display: "flex", gap: 10 }}>
          {step !== "cart" && (
            <button onClick={() => setStep(step === "shipping" ? "cart" : step === "info" ? "shipping" : "info")} style={{ background: "#fff", color: "#4a5e52", border: "1.5px solid #ede8e0", borderRadius: 10, padding: "12px 20px", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>← Zpět</button>
          )}
          {step === "cart" && cart.length > 0 && (
            <button onClick={() => setStep("shipping")} style={{ flex: 1, background: "#2d6a4f", color: "#fff", border: "none", borderRadius: 10, padding: "12px", fontSize: "0.95rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
              Pokračovat → ({totalProducts} Kč)
            </button>
          )}
          {step === "shipping" && (
            <button onClick={() => { if (!selectedShipping) { alert("Vyber dopravu"); return; } setStep("info"); }} style={{ flex: 1, background: "#2d6a4f", color: "#fff", border: "none", borderRadius: 10, padding: "12px", fontSize: "0.95rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
              Pokračovat →
            </button>
          )}
          {step === "info" && (
            <button onClick={() => { if (!form.name || !form.email || !form.phone || !form.address || !form.city) { setMsg("⚠️ Vyplň všechna povinná pole."); return; } setMsg(""); setStep("confirm"); }} style={{ flex: 1, background: "#2d6a4f", color: "#fff", border: "none", borderRadius: 10, padding: "12px", fontSize: "0.95rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
              Pokračovat →
            </button>
          )}
          {step === "confirm" && (
            <button onClick={handleOrder} disabled={saving} style={{ flex: 1, background: saving ? "#b5cec0" : "#2d6a4f", color: "#fff", border: "none", borderRadius: 10, padding: "12px", fontSize: "0.95rem", fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif" }}>
              {saving ? "Odesílám..." : "✓ Objednat"}
            </button>
          )}
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
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [shippingOptions, setShippingOptions] = useState([]);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [addedToCart, setAddedToCart] = useState({});

  useEffect(() => { fetchProducts(); }, []);
  useEffect(() => {
    if (cart.length > 0) {
      const sellerIds = [...new Set(cart.map(i => i.seller_id))];
      fetchShipping(sellerIds[0]);
    }
  }, [cart]);

  const fetchProducts = async () => {
    setLoading(true);
    const { data } = await supabase.from("products").select("*").eq("active", true).order("created_at", { ascending: false });
    if (data) setProducts(data);
    setLoading(false);
  };

  const fetchShipping = async (sellerId) => {
    const { data } = await supabase.from("shipping_options").select("*").eq("seller_id", sellerId);
    if (data) setShippingOptions(data);
  };

  const handleAddToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) return prev.map(i => i.id === product.id ? { ...i, qty: Math.min(i.qty + 1, i.stock) } : i);
      return [...prev, { ...product, qty: 1 }];
    });
    setAddedToCart(prev => ({ ...prev, [product.id]: true }));
    setTimeout(() => setAddedToCart(prev => ({ ...prev, [product.id]: false })), 2000);
  };

  const handleUpdateQty = (id, qty) => {
    if (qty <= 0) { setCart(prev => prev.filter(i => i.id !== id)); return; }
    setCart(prev => prev.map(i => i.id === id ? { ...i, qty } : i));
  };

  const handleSellerClick = (sellerId, sellerName) => {
    setSelectedSeller({ id: sellerId, name: sellerName });
    setCat("vse"); setAnimal("vse"); setSearch("");
  };

  const handleOrderSuccess = (orderId) => {
    setCart([]);
    setShowCart(false);
    setOrderSuccess(orderId);
    fetchProducts();
  };

  const filtered = products
    .filter(p => !selectedSeller || p.seller_id === selectedSeller.id)
    .filter(p => cat === "vse" || p.category === cat)
    .filter(p => animal === "vse" || p.animal === animal)
    .filter(p => p.price <= maxPrice)
    .filter(p => !search || p.title.toLowerCase().includes(search.toLowerCase()));

  const sellers = [...new Map(products.map(p => [p.seller_id, { id: p.seller_id, name: p.seller_name }])).values()];
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

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
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button onClick={() => navigate("/")} style={{ background: "#fff", color: "#4a5e52", border: "1.5px solid #ede8e0", borderRadius: 8, padding: "8px 16px", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>← Zpět</button>
          <button onClick={() => setShowCart(true)} style={{ position: "relative", background: cartCount > 0 ? "#2d6a4f" : "#fff", color: cartCount > 0 ? "#fff" : "#4a5e52", border: `1.5px solid ${cartCount > 0 ? "#2d6a4f" : "#ede8e0"}`, borderRadius: 8, padding: "8px 16px", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
            🛒 Košík {cartCount > 0 && <span style={{ background: "#e07b39", color: "#fff", borderRadius: "50%", width: 18, height: 18, fontSize: "0.7rem", fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center", marginLeft: 4 }}>{cartCount}</span>}
          </button>
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
              <ProductCard key={product.id} product={product} onOpen={setSelectedProduct} onSellerClick={handleSellerClick} onAddToCart={handleAddToCart} addedToCart={!!addedToCart[product.id]} />
            ))}
          </div>
        )}
      </main>

      {selectedProduct && <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} onAddToCart={handleAddToCart} isInCart={!!cart.find(i => i.id === selectedProduct.id)} />}

      {showCart && (
        <CartPanel
          cart={cart}
          onClose={() => setShowCart(false)}
          onUpdateQty={handleUpdateQty}
          onRemove={id => setCart(prev => prev.filter(i => i.id !== id))}
          shippingOptions={shippingOptions}
          user={user}
          onOrderSuccess={handleOrderSuccess}
        />
      )}

      {orderSuccess && <OrderSuccessModal orderNumber={orderSuccess.slice(0, 8).toUpperCase()} onClose={() => setOrderSuccess(null)} />}

      <footer style={{ background: "#1c2b22", color: "rgba(255,255,255,0.5)", padding: "24px", textAlign: "center", fontSize: "0.8rem" }}>
        <span style={{ fontFamily: "'DM Serif Display', serif", color: "rgba(255,255,255,0.8)", fontSize: "1rem" }}>Pet Market</span>
        {" "}· Tržiště pro mazlíčky · Celá ČR · {new Date().getFullYear()}
      </footer>
    </div>
  );
}