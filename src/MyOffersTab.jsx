import { useState, useEffect } from "react";
import { supabase } from "./supabase";

const STATUS_CONFIG = {
  pending: { bg: "#fff8e1", color: "#e65100", label: "⏳ Čeká na odpověď" },
  accepted: { bg: "#e8f5e9", color: "#1b5e20", label: "✅ Přijato" },
  rejected: { bg: "#fce4ec", color: "#880e4f", label: "❌ Odmítnuto" },
  countered: { bg: "#e3f2fd", color: "#0d47a1", label: "🔄 Protinávrh" },
  expired: { bg: "#f5f5f5", color: "#6b7280", label: "⌛ Vypršelo" },
  paid: { bg: "#e0f2f1", color: "#00695c", label: "💰 Zaplaceno" },
};

const SHIPPING_OPTIONS = [
  { id: "personal", name: "Osobní odběr", price: 0, icon: "🤝" },
  { id: "zasilkovna", name: "Zásilkovna", price: 79, icon: "📦" },
  { id: "ppl", name: "PPL balík", price: 119, icon: "🚚" },
];

export default function MyOffersTab({ user, profile }) {
  const [mode, setMode] = useState("received");
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOffer, setSelectedOffer] = useState(null);

  useEffect(() => {
    fetchOffers();
    const channel = supabase
      .channel(`offers-${user.id}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "offers",
        filter: `${mode === "received" ? "seller_id" : "buyer_id"}=eq.${user.id}`
      }, () => fetchOffers())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [user, mode]);

  const fetchOffers = async () => {
    setLoading(true);
    const column = mode === "received" ? "seller_id" : "buyer_id";
    const { data } = await supabase
      .from("offers")
      .select("*")
      .eq(column, user.id)
      .order("created_at", { ascending: false });

    if (data && data.length > 0) {
      const inzeratIds = [...new Set(data.map(o => o.inzerat_id))];
      const { data: inzeraty } = await supabase
        .from("inzeraty")
        .select("id, title, foto_urls, price, seller_name, city")
        .in("id", inzeratIds);

      const inzeratMap = {};
      (inzeraty || []).forEach(i => { inzeratMap[i.id] = i; });

      const enriched = data.map(o => ({
        ...o,
        inzerat: inzeratMap[o.inzerat_id] || null,
      }));
      setOffers(enriched);
    } else {
      setOffers([]);
    }
    setLoading(false);
  };

  const pendingCount = offers.filter(o => o.status === "pending").length;
  const counteredForBuyer = mode === "sent" ? offers.filter(o => o.status === "countered").length : 0;
  const acceptedForBuyer = mode === "sent" ? offers.filter(o => o.status === "accepted" && !o.order_id).length : 0;

  return (
    <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #ede8e0", overflow: "hidden", minHeight: 400 }}>
      {selectedOffer ? (
        <OfferDetail
          offer={selectedOffer}
          mode={mode}
          user={user}
          profile={profile}
          onClose={() => { setSelectedOffer(null); fetchOffers(); }}
          onUpdate={fetchOffers}
        />
      ) : (
        <>
          <div style={{ padding: "24px 28px 0", borderBottom: "1px solid #ede8e0" }}>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.4rem", color: "#1c2b22", marginBottom: 16 }}>Moje nabídky</h2>
            <div style={{ display: "flex", gap: 0, borderBottom: "none" }}>
              <button
                onClick={() => setMode("received")}
                style={{
                  padding: "12px 20px",
                  background: "none",
                  border: "none",
                  borderBottom: mode === "received" ? "2px solid #2d6a4f" : "2px solid transparent",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  fontWeight: mode === "received" ? 700 : 500,
                  color: mode === "received" ? "#2d6a4f" : "#8a9e92",
                  fontFamily: "'DM Sans', sans-serif",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                📥 Přijaté (na mé inzeráty)
                {mode === "received" && pendingCount > 0 && (
                  <span style={{ background: "#e07b39", color: "#fff", borderRadius: 20, padding: "1px 8px", fontSize: "0.72rem", fontWeight: 700 }}>{pendingCount}</span>
                )}
              </button>
              <button
                onClick={() => setMode("sent")}
                style={{
                  padding: "12px 20px",
                  background: "none",
                  border: "none",
                  borderBottom: mode === "sent" ? "2px solid #2d6a4f" : "2px solid transparent",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  fontWeight: mode === "sent" ? 700 : 500,
                  color: mode === "sent" ? "#2d6a4f" : "#8a9e92",
                  fontFamily: "'DM Sans', sans-serif",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                📤 Odeslané (moje nabídky)
                {mode === "sent" && (counteredForBuyer + acceptedForBuyer) > 0 && (
                  <span style={{ background: "#2d6a4f", color: "#fff", borderRadius: 20, padding: "1px 8px", fontSize: "0.72rem", fontWeight: 700 }}>
                    {counteredForBuyer + acceptedForBuyer}
                  </span>
                )}
              </button>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#8a9e92" }}>Načítám...</div>
          ) : offers.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#8a9e92" }}>
              <div style={{ fontSize: "3rem", marginBottom: 16 }}>{mode === "received" ? "📥" : "📤"}</div>
              <p style={{ fontSize: "0.95rem", marginBottom: 8 }}>
                {mode === "received" ? "Zatím ti nikdo nenabídl jinou cenu." : "Zatím jsi neodeslal žádnou nabídku."}
              </p>
              <p style={{ fontSize: "0.82rem" }}>
                {mode === "received" ? "Až někdo nabídne jinou cenu na tvůj inzerát, uvidíš ji tady." : "Najdi inzerát v bazaru a klikni na '💰 Nabídnout cenu'."}
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {offers.map(offer => (
                <OfferRow
                  key={offer.id}
                  offer={offer}
                  mode={mode}
                  onClick={() => setSelectedOffer(offer)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function OfferRow({ offer, mode, onClick }) {
  const config = STATUS_CONFIG[offer.status] || STATUS_CONFIG.pending;
  const displayPrice = offer.status === "countered" && offer.counter_price ? offer.counter_price : offer.offered_price;
  const savings = Math.round(((offer.original_price - displayPrice) / offer.original_price) * 100);

  // Určit prioritu — kupující má odsouhlasit/odmítnout protinávrh nebo zaplatit
  const needsAction = mode === "sent" && (offer.status === "countered" || (offer.status === "accepted" && !offer.order_id));
  const isPendingSeller = mode === "received" && offer.status === "pending";

  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "16px 24px",
        borderBottom: "1px solid #f7f4ef",
        cursor: "pointer",
        background: (needsAction || isPendingSeller) ? "#f2faf6" : "#fff",
        transition: "background 0.15s",
      }}
      onMouseOver={e => e.currentTarget.style.background = "#f7f4ef"}
      onMouseOut={e => e.currentTarget.style.background = (needsAction || isPendingSeller) ? "#f2faf6" : "#fff"}
    >
      <div style={{ width: 56, height: 56, borderRadius: 10, background: "#e8f5ef", overflow: "hidden", flexShrink: 0 }}>
        {offer.inzerat?.foto_urls?.[0] ? (
          <img src={offer.inzerat.foto_urls[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>🐾</div>
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, color: "#1c2b22", marginBottom: 3, fontSize: "0.92rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {offer.inzerat?.title || "Smazaný inzerát"}
        </div>
        <div style={{ fontSize: "0.8rem", color: "#8a9e92", marginBottom: 4 }}>
          {mode === "received" ? "Od kupujícího" : "Prodejce"}: {offer.inzerat?.seller_name || "—"}
        </div>
        <div style={{ fontSize: "0.82rem", color: "#4a5e52", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ textDecoration: "line-through", color: "#8a9e92" }}>{offer.original_price} Kč</span>
          <span style={{ color: "#8a9e92" }}>→</span>
          <span style={{ fontWeight: 700, color: "#2d6a4f", fontSize: "0.95rem" }}>{displayPrice} Kč</span>
          <span style={{ background: "#fdf0e6", color: "#e07b39", borderRadius: 20, padding: "1px 8px", fontSize: "0.7rem", fontWeight: 700 }}>-{savings}%</span>
        </div>
      </div>

      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <span style={{ background: config.bg, color: config.color, borderRadius: 20, padding: "4px 12px", fontSize: "0.72rem", fontWeight: 700, whiteSpace: "nowrap", display: "inline-block", marginBottom: 6 }}>
          {config.label}
        </span>
        <div style={{ fontSize: "0.7rem", color: "#8a9e92" }}>
          {new Date(offer.created_at).toLocaleDateString("cs-CZ")}
        </div>
      </div>
    </div>
  );
}

function OfferDetail({ offer, mode, user, profile, onClose, onUpdate }) {
  const [action, setAction] = useState(null);
  const [counterPrice, setCounterPrice] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showBuyForm, setShowBuyForm] = useState(false);

  const config = STATUS_CONFIG[offer.status] || STATUS_CONFIG.pending;
  const displayPrice = offer.status === "countered" && offer.counter_price ? offer.counter_price : offer.offered_price;

  const sendEmail = async (eventType, extraData = {}) => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      await fetch(`${supabaseUrl}/functions/v1/send-order-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${supabaseKey}` },
        body: JSON.stringify({
          sellerEmail: extraData.email || "horejsi.jakub7799@gmail.com",
          sellerName: extraData.name || "Uživatel",
          order: {
            _isOfferUpdate: true,
            _eventType: eventType,
            _itemTitle: offer.inzerat?.title || "Inzerát",
            _originalPrice: offer.original_price,
            _offeredPrice: offer.offered_price,
            _counterPrice: offer.counter_price,
            _offerId: offer.id,
            ...extraData,
          },
        }),
      });
    } catch (e) { console.error("Email error:", e); }
  };

  const handleAccept = async () => {
    setSaving(true);
    const { error: err } = await supabase
      .from("offers")
      .update({ status: "accepted", responded_at: new Date().toISOString() })
      .eq("id", offer.id);

    if (err) { setError("Chyba: " + err.message); setSaving(false); return; }

    // Get buyer email
    const { data: buyerData } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", offer.buyer_id)
      .single();

    await sendEmail("accepted", {
      email: buyerData?.email,
      name: buyerData?.name || "Kupující",
    });

    setSaving(false);
    onUpdate();
    onClose();
  };

  const handleReject = async () => {
    setSaving(true);
    const { error: err } = await supabase
      .from("offers")
      .update({ status: "rejected", responded_at: new Date().toISOString() })
      .eq("id", offer.id);

    if (err) { setError("Chyba: " + err.message); setSaving(false); return; }

    await sendEmail("rejected");
    setSaving(false);
    onUpdate();
    onClose();
  };

  const handleCounter = async () => {
    const price = parseInt(counterPrice);
    if (!price || price <= 0) return setError("Zadej platnou cenu");
    if (price >= offer.original_price) return setError(`Protinávrh musí být nižší než ${offer.original_price} Kč`);
    if (price <= offer.offered_price) return setError(`Protinávrh musí být vyšší než nabídka ${offer.offered_price} Kč`);

    setSaving(true);
    const { error: err } = await supabase
      .from("offers")
      .update({
        status: "countered",
        counter_price: price,
        responded_at: new Date().toISOString()
      })
      .eq("id", offer.id);

    if (err) { setError("Chyba: " + err.message); setSaving(false); return; }

    await sendEmail("countered", { _counterPrice: price });
    setSaving(false);
    onUpdate();
    onClose();
  };

  const handleAcceptCounter = async () => {
    // Kupující přijme protinávrh → nastavit status na accepted, cena = counter_price
    setSaving(true);
    const { error: err } = await supabase
      .from("offers")
      .update({
        status: "accepted",
        offered_price: offer.counter_price, // fixní cena pro nákup
      })
      .eq("id", offer.id);

    if (err) { setError("Chyba: " + err.message); setSaving(false); return; }
    setSaving(false);
    onUpdate();
    // Pokračuj rovnou k nákupu
    setShowBuyForm(true);
  };

  const handleRejectCounter = async () => {
    setSaving(true);
    await supabase
      .from("offers")
      .update({ status: "rejected" })
      .eq("id", offer.id);
    setSaving(false);
    onUpdate();
    onClose();
  };

  // POKUD je to přijatá nabídka a kupující klikne "Zaplatit & dokončit"
  if (showBuyForm) {
    return <BuyFromOfferForm
      offer={offer}
      user={user}
      profile={profile}
      finalPrice={offer.offered_price}
      onBack={() => setShowBuyForm(false)}
      onSuccess={() => { onUpdate(); onClose(); }}
    />;
  }

  return (
    <div style={{ padding: 0 }}>
      <div style={{ padding: "16px 24px", borderBottom: "1px solid #ede8e0", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onClose} style={{ background: "#f7f4ef", border: "none", borderRadius: "50%", width: 36, height: 36, cursor: "pointer", fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center" }}>←</button>
        <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.2rem", color: "#1c2b22", margin: 0 }}>Detail nabídky</h3>
      </div>

      <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "flex", gap: 14, padding: 16, background: "#f2faf6", borderRadius: 12 }}>
          <div style={{ width: 72, height: 72, borderRadius: 10, background: "#e8f5ef", overflow: "hidden", flexShrink: 0 }}>
            {offer.inzerat?.foto_urls?.[0] ? (
              <img src={offer.inzerat.foto_urls[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.8rem" }}>🐾</div>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: "#1c2b22", fontSize: "1rem", marginBottom: 4 }}>
              {offer.inzerat?.title || "Smazaný inzerát"}
            </div>
            <div style={{ fontSize: "0.82rem", color: "#8a9e92", marginBottom: 6 }}>
              📍 {offer.inzerat?.city || "—"} · Prodává: {offer.inzerat?.seller_name || "—"}
            </div>
            <span style={{ background: config.bg, color: config.color, borderRadius: 20, padding: "3px 10px", fontSize: "0.72rem", fontWeight: 700 }}>{config.label}</span>
          </div>
        </div>

        <div style={{ background: "#fff", border: "1px solid #ede8e0", borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "#8a9e92", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Cenové detaily</div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: "0.9rem", color: "#4a5e52" }}>
            <span>Původní cena</span>
            <span style={{ textDecoration: "line-through" }}>{offer.original_price} Kč</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: "0.9rem", color: "#4a5e52" }}>
            <span>Nabízená cena</span>
            <span style={{ fontWeight: 600 }}>{offer.offered_price} Kč</span>
          </div>
          {offer.counter_price && (
            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: "0.9rem", color: "#0d47a1" }}>
              <span>🔄 Protinávrh prodejce</span>
              <span style={{ fontWeight: 700 }}>{offer.counter_price} Kč</span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 0", borderTop: "1px solid #ede8e0", fontSize: "1rem", fontWeight: 700, color: "#2d6a4f", marginTop: 6 }}>
            <span>Aktuální cena</span>
            <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.2rem" }}>{displayPrice} Kč</span>
          </div>
        </div>

        {offer.message && (
          <div style={{ background: "#fff8e1", border: "1px solid #ffecb3", borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "#7a5b00", textTransform: "uppercase", marginBottom: 4 }}>💬 Zpráva od kupujícího</div>
            <div style={{ fontSize: "0.88rem", color: "#1c2b22" }}>{offer.message}</div>
          </div>
        )}

        {error && <div style={{ background: "#fee", color: "#b91c1c", padding: "10px 14px", borderRadius: 10, fontSize: "0.85rem" }}>{error}</div>}

        {/* AKCE — ZÁVISÍ NA STAVU A ROLI */}
        {mode === "received" && offer.status === "pending" && !action && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button onClick={handleAccept} disabled={saving} style={btnStyle("primary")}>
              ✅ Přijmout nabídku {offer.offered_price} Kč
            </button>
            <button onClick={() => setAction("counter")} disabled={saving} style={btnStyle("secondary")}>
              🔄 Poslat protinávrh
            </button>
            <button onClick={handleReject} disabled={saving} style={btnStyle("danger")}>
              ❌ Odmítnout
            </button>
          </div>
        )}

        {mode === "received" && action === "counter" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: 16, background: "#e3f2fd", borderRadius: 12 }}>
            <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#0d47a1" }}>
              Navrhni cenu mezi {offer.offered_price + 1} a {offer.original_price - 1} Kč:
            </div>
            <input
              type="number"
              placeholder={`Např. ${Math.round((offer.offered_price + offer.original_price) / 2)}`}
              value={counterPrice}
              onChange={e => setCounterPrice(e.target.value)}
              style={{
                width: "100%",
                border: "1.5px solid #ede8e0",
                borderRadius: 10,
                padding: "12px 14px",
                fontSize: "1.1rem",
                fontWeight: 700,
                color: "#0d47a1",
                outline: "none",
                fontFamily: "'DM Sans', sans-serif",
                background: "#fff",
                boxSizing: "border-box",
              }}
            />
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={handleCounter} disabled={saving} style={{ ...btnStyle("primary"), flex: 1 }}>
                {saving ? "Odesílám..." : "📤 Odeslat protinávrh"}
              </button>
              <button onClick={() => { setAction(null); setCounterPrice(""); setError(""); }} style={btnStyle("cancel")}>
                Zrušit
              </button>
            </div>
          </div>
        )}

        {mode === "sent" && offer.status === "countered" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ background: "#e3f2fd", border: "1px solid #90caf9", borderRadius: 10, padding: 14, fontSize: "0.88rem", color: "#0d47a1" }}>
              🔄 Prodejce poslal protinávrh: <strong>{offer.counter_price} Kč</strong>
            </div>
            <button onClick={handleAcceptCounter} disabled={saving} style={btnStyle("primary")}>
              ✅ Přijmout a zaplatit {offer.counter_price} Kč
            </button>
            <button onClick={handleRejectCounter} disabled={saving} style={btnStyle("danger")}>
              ❌ Odmítnout protinávrh
            </button>
          </div>
        )}

        {mode === "sent" && offer.status === "accepted" && !offer.order_id && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ background: "#e8f5e9", border: "1px solid #a5d6a7", borderRadius: 10, padding: 14, fontSize: "0.88rem", color: "#1b5e20" }}>
              ✅ Prodejce přijal tvou nabídku! Zaplať a zboží ti pošle.
            </div>
            <button onClick={() => setShowBuyForm(true)} style={btnStyle("primary")}>
              💳 Zaplatit a dokončit objednávku ({offer.offered_price} Kč)
            </button>
          </div>
        )}

        {offer.status === "rejected" && (
          <div style={{ background: "#fce4ec", border: "1px solid #f48fb1", borderRadius: 10, padding: 14, textAlign: "center", fontSize: "0.88rem", color: "#880e4f" }}>
            Tato nabídka byla odmítnuta.
          </div>
        )}

        {offer.order_id && (
          <div style={{ background: "#e0f2f1", border: "1px solid #80cbc4", borderRadius: 10, padding: 14, textAlign: "center", fontSize: "0.88rem", color: "#00695c" }}>
            💰 Nabídka byla zaplacena a převedena na objednávku.
          </div>
        )}
      </div>
    </div>
  );
}

function BuyFromOfferForm({ offer, user, profile, finalPrice, onBack, onSuccess }) {
  const [form, setForm] = useState({
    name: profile?.name || user?.user_metadata?.full_name || "",
    email: user?.email || "",
    phone: "",
    address: "",
  });
  const [shipping, setShipping] = useState("personal");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const selectedShipping = SHIPPING_OPTIONS.find(s => s.id === shipping);
  const totalPrice = finalPrice + (selectedShipping?.price || 0);

  const handleSubmit = async () => {
    if (!form.name.trim()) return setError("Zadej prosím své jméno");
    if (!form.email.trim()) return setError("Zadej prosím email");
    if (!form.phone.trim()) return setError("Zadej prosím telefon");
    if (shipping !== "personal" && !form.address.trim()) return setError("Zadej prosím doručovací adresu");

    setSaving(true);
    setError("");

    try {
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          buyer_id: user.id,
          seller_id: offer.seller_id,
          buyer_name: form.name,
          buyer_email: form.email,
          buyer_phone: form.phone,
          buyer_address: shipping === "personal" ? "Osobní odběr" : form.address,
          shipping_name: selectedShipping.name,
          shipping_price: selectedShipping.price,
          total_products: finalPrice,
          total_price: totalPrice,
          status: "pending_payment",
        })
        .select()
        .single();

      if (orderError) throw orderError;

      await supabase.from("order_items").insert({
        order_id: order.id,
        inzerat_id: offer.inzerat_id,
        title: offer.inzerat?.title || "Inzerát",
        price: finalPrice,
        quantity: 1,
      });

      // Propojit objednávku s nabídkou
      await supabase
        .from("offers")
        .update({ status: "paid", order_id: order.id })
        .eq("id", offer.id);

      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        await fetch(`${supabaseUrl}/functions/v1/send-order-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${supabaseKey}` },
          body: JSON.stringify({
            sellerEmail: "horejsi.jakub7799@gmail.com",
            sellerName: "Prodejce",
            order: {
              id: order.id,
              item_title: offer.inzerat?.title || "Inzerát",
              item_price: finalPrice,
              shipping_name: selectedShipping.name,
              total_price: totalPrice,
              _fromAcceptedOffer: true,
            },
          }),
        });
      } catch (e) { console.error(e); }

      onSuccess();
    } catch (err) {
      console.error(err);
      setError("Nepodařilo se vytvořit objednávku: " + err.message);
    }
    setSaving(false);
  };

  const inputStyle = { width: "100%", border: "1.5px solid #ede8e0", borderRadius: 10, padding: "11px 14px", fontSize: "0.9rem", outline: "none", background: "#f7f4ef", color: "#1c2b22", fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box" };
  const labelStyle = { fontSize: "0.72rem", fontWeight: 600, color: "#8a9e92", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 };

  return (
    <div>
      <div style={{ padding: "16px 24px", borderBottom: "1px solid #ede8e0", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onBack} style={{ background: "#f7f4ef", border: "none", borderRadius: "50%", width: 36, height: 36, cursor: "pointer", fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center" }}>←</button>
        <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.2rem", color: "#1c2b22", margin: 0 }}>Dokončit objednávku</h3>
      </div>

      <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ display: "flex", gap: 12, padding: 14, background: "#e8f5e9", borderRadius: 12, border: "1px solid #a5d6a7" }}>
          <div style={{ width: 60, height: 60, borderRadius: 10, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
            {offer.inzerat?.foto_urls?.[0] ? <img src={offer.inzerat.foto_urls[0]} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span>🐾</span>}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "0.9rem", fontWeight: 600 }}>{offer.inzerat?.title}</div>
            <div style={{ fontSize: "0.75rem", color: "#1b5e20", fontWeight: 600, marginTop: 2 }}>✨ Domluvená cena</div>
            <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "#2d6a4f", marginTop: 4, fontFamily: "'DM Serif Display', serif" }}>{finalPrice} Kč</div>
          </div>
        </div>

        <div>
          <label style={labelStyle}>Kontaktní údaje</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input style={inputStyle} placeholder="Jméno a příjmení *" value={form.name} onChange={e => set("name", e.target.value)} />
            <input style={inputStyle} type="email" placeholder="Email *" value={form.email} onChange={e => set("email", e.target.value)} />
            <input style={inputStyle} type="tel" placeholder="Telefon *" value={form.phone} onChange={e => set("phone", e.target.value)} />
          </div>
        </div>

        <div>
          <label style={labelStyle}>Způsob dopravy</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {SHIPPING_OPTIONS.map(opt => (
              <label key={opt.id} style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: 14,
                borderRadius: 12,
                border: `2px solid ${shipping === opt.id ? "#2d6a4f" : "#ede8e0"}`,
                cursor: "pointer",
                background: shipping === opt.id ? "#f2faf6" : "#fff",
              }}>
                <input type="radio" name="shipping" checked={shipping === opt.id} onChange={() => setShipping(opt.id)} style={{ accentColor: "#2d6a4f", cursor: "pointer" }} />
                <div style={{ fontSize: "1.4rem" }}>{opt.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "0.9rem", fontWeight: 600 }}>{opt.name}</div>
                </div>
                <div style={{ fontSize: "0.95rem", fontWeight: 700, color: opt.price === 0 ? "#2d6a4f" : "#1c2b22" }}>
                  {opt.price === 0 ? "Zdarma" : `${opt.price} Kč`}
                </div>
              </label>
            ))}
          </div>
        </div>

        {shipping !== "personal" && (
          <div>
            <label style={labelStyle}>Doručovací adresa *</label>
            <textarea
              style={{ ...inputStyle, minHeight: 70, resize: "vertical" }}
              placeholder="Ulice, číslo, město, PSČ"
              value={form.address}
              onChange={e => set("address", e.target.value)}
            />
          </div>
        )}

        <div style={{ background: "#f7f4ef", borderRadius: 12, padding: 16, border: "1px solid #ede8e0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: "0.88rem", color: "#4a5e52" }}>
            <span>Produkt</span>
            <span>{finalPrice} Kč</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: "0.88rem", color: "#4a5e52" }}>
            <span>Doprava</span>
            <span>{selectedShipping?.price === 0 ? "Zdarma" : `${selectedShipping?.price} Kč`}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 10, borderTop: "1px solid #ede8e0", fontSize: "1.1rem", fontWeight: 700 }}>
            <span>Celkem</span>
            <span style={{ color: "#2d6a4f", fontFamily: "'DM Serif Display', serif", fontSize: "1.4rem" }}>{totalPrice} Kč</span>
          </div>
        </div>

        {error && <div style={{ background: "#fee", color: "#b91c1c", padding: "10px 14px", borderRadius: 10, fontSize: "0.85rem" }}>{error}</div>}

        <div style={{ background: "#f0f7f4", border: "1px solid #b7d9c7", borderRadius: 10, padding: "10px 14px", fontSize: "0.78rem", color: "#2d5a3d", lineHeight: 1.5 }}>
          🔒 <strong>Pet Market Shield</strong> — peníze uvolníme prodejci až po potvrzení doručení.
        </div>

        <button onClick={handleSubmit} disabled={saving} style={btnStyle("primary")}>
          {saving ? "Odesílám..." : `✓ Potvrdit objednávku za ${totalPrice} Kč`}
        </button>
      </div>
    </div>
  );
}

function btnStyle(variant) {
  const base = {
    padding: "14px",
    fontSize: "0.95rem",
    fontWeight: 600,
    borderRadius: 10,
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    width: "100%",
    border: "none",
  };
  if (variant === "primary") return { ...base, background: "#2d6a4f", color: "#fff", boxShadow: "0 2px 12px rgba(45,106,79,0.25)" };
  if (variant === "secondary") return { ...base, background: "#fff", color: "#0d47a1", border: "2px solid #0d47a1" };
  if (variant === "danger") return { ...base, background: "#fff", color: "#b91c1c", border: "2px solid #fecaca" };
  if (variant === "cancel") return { ...base, background: "#fff", color: "#4a5e52", border: "1.5px solid #ede8e0", width: "auto", padding: "12px 20px" };
  return base;
}