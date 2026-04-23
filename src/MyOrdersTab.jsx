import { useState, useEffect } from "react";
import { supabase } from "./supabase";

const STATUS_CONFIG = {
  pending_payment: { bg: "#fff8e1", color: "#e65100", label: "⏳ Čeká na platbu" },
  paid: { bg: "#e8f5e9", color: "#1b5e20", label: "💰 Zaplaceno" },
  shipped: { bg: "#e3f2fd", color: "#0d47a1", label: "📦 Odesláno" },
  delivered: { bg: "#e0f2f1", color: "#00695c", label: "✅ Doručeno" },
  cancelled: { bg: "#fce4ec", color: "#880e4f", label: "❌ Zrušeno" },
};

export default function MyOrdersTab({ user }) {
  const [mode, setMode] = useState("bought"); // bought | sold
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, [user, mode]);

  const fetchOrders = async () => {
    setLoading(true);
    const column = mode === "bought" ? "buyer_id" : "seller_id";
    const { data: ordersData } = await supabase
      .from("orders")
      .select("*")
      .eq(column, user.id)
      .order("created_at", { ascending: false });

    if (ordersData && ordersData.length > 0) {
      // Fetch order_items
      const orderIds = ordersData.map(o => o.id);
      const { data: items } = await supabase
        .from("order_items")
        .select("*")
        .in("order_id", orderIds);

      // Fetch inzeraty for photos
      const inzeratIds = [...new Set((items || []).map(i => i.inzerat_id).filter(Boolean))];
      const { data: inzeraty } = await supabase
        .from("inzeraty")
        .select("id, title, foto_urls")
        .in("id", inzeratIds);

      const inzeratMap = {};
      (inzeraty || []).forEach(i => { inzeratMap[i.id] = i; });

      const itemsByOrder = {};
      (items || []).forEach(it => {
        if (!itemsByOrder[it.order_id]) itemsByOrder[it.order_id] = [];
        itemsByOrder[it.order_id].push({ ...it, inzerat: inzeratMap[it.inzerat_id] });
      });

      const enriched = ordersData.map(o => ({
        ...o,
        items: itemsByOrder[o.id] || [],
      }));

      setOrders(enriched);
    } else {
      setOrders([]);
    }
    setLoading(false);
  };

  const updateStatus = async (orderId, newStatus) => {
    await supabase.from("orders").update({ status: newStatus }).eq("id", orderId);
    await fetchOrders();
    if (selected?.id === orderId) {
      const updated = orders.find(o => o.id === orderId);
      if (updated) setSelected({ ...updated, status: newStatus });
    }
  };

  const boughtCount = mode === "bought" ? orders.length : 0;
  const soldCount = mode === "sold" ? orders.length : 0;

  if (selected) {
    return <OrderDetail order={selected} mode={mode} onBack={() => setSelected(null)} onStatusUpdate={updateStatus} />;
  }

  return (
    <div style={{ background: "#fff", borderRadius: 16, padding: "28px 32px", border: "1px solid #ede8e0" }}>
      <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.4rem", color: "#1c2b22", marginBottom: 20 }}>📦 Moje objednávky</h2>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 2, borderBottom: "1px solid #ede8e0", marginBottom: 24 }}>
        <button
          onClick={() => setMode("bought")}
          style={{
            padding: "12px 20px",
            background: "none",
            border: "none",
            borderBottom: mode === "bought" ? "2px solid #2d6a4f" : "2px solid transparent",
            cursor: "pointer",
            fontSize: "0.9rem",
            fontWeight: mode === "bought" ? 700 : 500,
            color: mode === "bought" ? "#2d6a4f" : "#8a9e92",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          🛍️ Nakoupené
        </button>
        <button
          onClick={() => setMode("sold")}
          style={{
            padding: "12px 20px",
            background: "none",
            border: "none",
            borderBottom: mode === "sold" ? "2px solid #2d6a4f" : "2px solid transparent",
            cursor: "pointer",
            fontSize: "0.9rem",
            fontWeight: mode === "sold" ? 700 : 500,
            color: mode === "sold" ? "#2d6a4f" : "#8a9e92",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          💼 Prodané
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "#8a9e92" }}>Načítám...</div>
      ) : orders.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 20px", color: "#8a9e92" }}>
          <div style={{ fontSize: "3rem", marginBottom: 12 }}>📦</div>
          <p style={{ fontSize: "0.95rem", marginBottom: 6 }}>
            {mode === "bought" ? "Zatím žádné nákupy" : "Zatím žádné prodané objednávky"}
          </p>
          <p style={{ fontSize: "0.82rem" }}>
            {mode === "bought" ? "Tvoje nákupy se tu zobrazí po dokončení objednávky." : "Objednávky od tvých kupujících se tu zobrazí."}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {orders.map(order => {
            const status = STATUS_CONFIG[order.status] || { bg: "#f5f5f5", color: "#6b7280", label: order.status };
            const firstItem = order.items[0];
            return (
              <div
                key={order.id}
                onClick={() => setSelected(order)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: 14,
                  border: "1px solid #ede8e0",
                  borderRadius: 12,
                  background: "#fff",
                  cursor: "pointer",
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "#f7f4ef"}
                onMouseLeave={e => e.currentTarget.style.background = "#fff"}
              >
                <div style={{ width: 60, height: 60, borderRadius: 10, background: "#e8f5ef", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {firstItem?.inzerat?.foto_urls?.[0] ? (
                    <img src={firstItem.inzerat.foto_urls[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <span style={{ fontSize: "1.6rem" }}>🐾</span>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                    <span style={{ fontSize: "0.7rem", fontWeight: 700, color: status.color, background: status.bg, padding: "3px 10px", borderRadius: 20 }}>
                      {status.label}
                    </span>
                    {order.offer_id && (
                      <span style={{ fontSize: "0.68rem", fontWeight: 600, color: "#e07b39", background: "#fdf0e6", padding: "3px 8px", borderRadius: 20 }}>
                        ✨ Z nabídky
                      </span>
                    )}
                  </div>
                  <div style={{ fontWeight: 600, color: "#1c2b22", fontSize: "0.92rem", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {firstItem?.title || "Inzerát"}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#8a9e92", display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <span>🚚 {order.shipping_name}</span>
                    <span>{new Date(order.created_at).toLocaleDateString("cs-CZ")}</span>
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "#2d6a4f", fontFamily: "'DM Serif Display', serif" }}>
                    {order.total_price} Kč
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function OrderDetail({ order, mode, onBack, onStatusUpdate }) {
  const status = STATUS_CONFIG[order.status] || { bg: "#f5f5f5", color: "#6b7280", label: order.status };
  const isSeller = mode === "sold";
  const firstItem = order.items[0];

  return (
    <div style={{ background: "#fff", borderRadius: 16, padding: "28px 32px", border: "1px solid #ede8e0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <button onClick={onBack} style={{ background: "#f7f4ef", border: "none", borderRadius: "50%", width: 36, height: 36, cursor: "pointer", fontSize: "1rem" }}>←</button>
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.3rem", color: "#1c2b22", margin: 0 }}>Detail objednávky</h2>
        <span style={{ marginLeft: "auto", fontSize: "0.78rem", fontWeight: 700, color: status.color, background: status.bg, padding: "5px 14px", borderRadius: 20 }}>
          {status.label}
        </span>
      </div>

      {/* Položky */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "#8a9e92", textTransform: "uppercase", marginBottom: 8 }}>Zboží</div>
        {order.items.map(item => (
          <div key={item.id} style={{ display: "flex", gap: 14, padding: 14, background: "#f7f4ef", borderRadius: 12, marginBottom: 8 }}>
            <div style={{ width: 70, height: 70, borderRadius: 10, background: "#fff", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {item.inzerat?.foto_urls?.[0] ? (
                <img src={item.inzerat.foto_urls[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <span style={{ fontSize: "1.8rem" }}>🐾</span>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, color: "#1c2b22", fontSize: "0.95rem", marginBottom: 6 }}>{item.title}</div>
              <div style={{ fontSize: "0.8rem", color: "#4a5e52" }}>Množství: {item.quantity}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "1rem", fontWeight: 700, color: "#2d6a4f" }}>{item.price * item.quantity} Kč</div>
            </div>
          </div>
        ))}
      </div>

      {/* Doprava a platba */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
        <div style={{ background: "#f7f4ef", borderRadius: 10, padding: "12px 14px" }}>
          <div style={{ fontSize: "0.68rem", fontWeight: 600, color: "#8a9e92", textTransform: "uppercase", marginBottom: 4 }}>Doprava</div>
          <div style={{ fontSize: "0.88rem", color: "#1c2b22", fontWeight: 500 }}>🚚 {order.shipping_name}</div>
          <div style={{ fontSize: "0.75rem", color: "#4a5e52", marginTop: 2 }}>{order.shipping_price} Kč</div>
        </div>
        <div style={{ background: "#f7f4ef", borderRadius: 10, padding: "12px 14px" }}>
          <div style={{ fontSize: "0.68rem", fontWeight: 600, color: "#8a9e92", textTransform: "uppercase", marginBottom: 4 }}>Datum</div>
          <div style={{ fontSize: "0.88rem", color: "#1c2b22", fontWeight: 500 }}>{new Date(order.created_at).toLocaleDateString("cs-CZ", { day: "numeric", month: "long", year: "numeric" })}</div>
        </div>
      </div>

      {/* Kontakt - zobrazí se jen pokud placeno nebo odesláno */}
      {(order.status !== "pending_payment" || isSeller) && (
        <div style={{ marginBottom: 24, padding: 16, background: "#e8f5ef", borderRadius: 12, border: "1px solid #b7d9c7" }}>
          <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "#2d6a4f", textTransform: "uppercase", marginBottom: 10 }}>
            {isSeller ? "👤 Údaje kupujícího" : "📍 Dodací adresa"}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: "0.85rem" }}>
            <div>
              <div style={{ color: "#8a9e92", fontSize: "0.72rem" }}>Jméno</div>
              <div style={{ color: "#1c2b22", fontWeight: 500 }}>{order.buyer_name}</div>
            </div>
            <div>
              <div style={{ color: "#8a9e92", fontSize: "0.72rem" }}>Telefon</div>
              <div style={{ color: "#1c2b22", fontWeight: 500 }}>{order.buyer_phone}</div>
            </div>
            {isSeller && (
              <div style={{ gridColumn: "1 / -1" }}>
                <div style={{ color: "#8a9e92", fontSize: "0.72rem" }}>Email</div>
                <div style={{ color: "#1c2b22", fontWeight: 500 }}>{order.buyer_email}</div>
              </div>
            )}
            <div style={{ gridColumn: "1 / -1" }}>
              <div style={{ color: "#8a9e92", fontSize: "0.72rem" }}>Adresa</div>
              <div style={{ color: "#1c2b22", fontWeight: 500 }}>{order.buyer_address}</div>
            </div>
          </div>
        </div>
      )}

      {order.status === "pending_payment" && !isSeller && (
        <div style={{ marginBottom: 20, padding: 14, background: "#fff8e1", borderRadius: 10, border: "1px solid #ffecb3", fontSize: "0.85rem", color: "#7a5b00" }}>
          ⏳ Čeká na platbu. Prodejci zatím neuvidí tvou adresu — Pet Market Shield chrání obě strany.
        </div>
      )}

      {/* Celkem */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", background: "#1c2b22", color: "#fff", borderRadius: 12, marginBottom: 20 }}>
        <span style={{ fontSize: "0.95rem" }}>Celkem k úhradě</span>
        <span style={{ fontSize: "1.4rem", fontWeight: 700, fontFamily: "'DM Serif Display', serif" }}>{order.total_price} Kč</span>
      </div>

      {/* Seller akce */}
      {isSeller && order.status === "pending_payment" && (
        <button
          onClick={() => onStatusUpdate(order.id, "paid")}
          style={{ width: "100%", background: "#2d6a4f", color: "#fff", border: "none", borderRadius: 10, padding: "12px", fontSize: "0.95rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", marginBottom: 8 }}
        >
          💰 Označit jako zaplacené
        </button>
      )}
      {isSeller && order.status === "paid" && (
        <button
          onClick={() => onStatusUpdate(order.id, "shipped")}
          style={{ width: "100%", background: "#1a4fa0", color: "#fff", border: "none", borderRadius: 10, padding: "12px", fontSize: "0.95rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", marginBottom: 8 }}
        >
          📦 Označit jako odeslané
        </button>
      )}
      {isSeller && order.status === "shipped" && (
        <button
          onClick={() => onStatusUpdate(order.id, "delivered")}
          style={{ width: "100%", background: "#00695c", color: "#fff", border: "none", borderRadius: 10, padding: "12px", fontSize: "0.95rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
        >
          ✅ Označit jako doručené
        </button>
      )}

      {/* Buyer akce */}
      {!isSeller && order.status === "shipped" && (
        <button
          onClick={() => onStatusUpdate(order.id, "delivered")}
          style={{ width: "100%", background: "#2d6a4f", color: "#fff", border: "none", borderRadius: 10, padding: "12px", fontSize: "0.95rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
        >
          ✅ Potvrdit doručení
        </button>
      )}
    </div>
  );
}