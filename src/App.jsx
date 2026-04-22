import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import { useAuth } from "./useAuth";
import AuthModal from "./AuthModal";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600;700&display=swap');`;

const CSS = `
  ${FONTS}
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --green: #2d6a4f; --green-mid: #3a856a; --green-light: #e8f5ef; --green-pale: #f2faf6;
    --sand: #f7f4ef; --sand-dark: #ede8e0; --text: #1c2b22; --text-mid: #4a5e52;
    --text-light: #8a9e92; --white: #ffffff; --accent: #e07b39; --accent-light: #fdf0e6;
    --shadow-sm: 0 1px 4px rgba(44,80,58,0.07); --shadow-md: 0 4px 20px rgba(44,80,58,0.10);
    --shadow-lg: 0 12px 40px rgba(44,80,58,0.14); --radius: 16px; --radius-sm: 10px;
  }
  body { font-family: 'DM Sans', sans-serif; background: var(--sand); color: var(--text); }
  h1,h2,h3 { font-family: 'DM Serif Display', serif; }
  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: var(--sand-dark); }
  ::-webkit-scrollbar-thumb { background: #b5cec0; border-radius: 4px; }
  input, select, textarea { font-family: 'DM Sans', sans-serif; }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes popIn { from { opacity: 0; transform: scale(0.94); } to { opacity: 1; transform: scale(1); } }
  @keyframes toastIn { from { opacity: 0; transform: translateX(-50%) translateY(12px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
  .card { background: var(--white); border-radius: var(--radius); border: 1.5px solid var(--sand-dark); box-shadow: var(--shadow-sm); transition: transform 0.2s ease, box-shadow 0.2s ease; cursor: pointer; overflow: hidden; animation: fadeUp 0.4s ease both; }
  .card:hover { transform: translateY(-5px); box-shadow: var(--shadow-lg); }
  .pill { display: inline-flex; align-items: center; gap: 5px; padding: 5px 13px; border-radius: 30px; font-size: 0.8rem; font-weight: 600; cursor: pointer; transition: all 0.18s; border: none; font-family: 'DM Sans', sans-serif; }
  .pill-outline { background: var(--white); color: var(--text-mid); border: 1.5px solid var(--sand-dark); }
  .pill-outline:hover { border-color: var(--green); color: var(--green); }
  .pill-active { background: var(--green); color: var(--white); border: 1.5px solid var(--green); }
  .pill-dark { background: var(--text); color: var(--white); border: 1.5px solid var(--text); }
  .pill-dark-outline { background: var(--white); color: var(--text); border: 1.5px solid var(--sand-dark); }
  .pill-dark-outline:hover { border-color: var(--text); }
  .btn-primary { background: var(--green); color: var(--white); border: none; border-radius: var(--radius-sm); padding: 12px 22px; font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: background 0.18s, box-shadow 0.18s; font-family: 'DM Sans', sans-serif; box-shadow: 0 2px 12px rgba(45,106,79,0.25); }
  .btn-primary:hover { background: var(--green-mid); box-shadow: 0 4px 18px rgba(45,106,79,0.32); }
  .btn-secondary { background: var(--white); color: var(--green); border: 2px solid var(--green); border-radius: var(--radius-sm); padding: 10px 20px; font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: all 0.18s; font-family: 'DM Sans', sans-serif; }
  .btn-secondary:hover { background: var(--green-pale); }
  .input-field { width: 100%; border: 1.5px solid var(--sand-dark); border-radius: var(--radius-sm); padding: 11px 14px; font-size: 0.9rem; outline: none; background: var(--sand); color: var(--text); transition: border-color 0.18s, box-shadow 0.18s; font-family: 'DM Sans', sans-serif; }
  .input-field:focus { border-color: var(--green); box-shadow: 0 0 0 3px rgba(45,106,79,0.12); background: var(--white); }
  .label { font-size: 0.75rem; font-weight: 600; color: var(--text-mid); text-transform: uppercase; letter-spacing: 0.06em; display: block; margin-bottom: 6px; }
  .overlay { position: fixed; inset: 0; background: rgba(28,43,34,0.5); display: flex; align-items: center; justify-content: center; z-index: 200; padding: 20px; backdrop-filter: blur(5px); }
  .modal { background: var(--white); border-radius: 22px; max-width: 500px; width: 100%; max-height: 92vh; overflow-y: auto; box-shadow: var(--shadow-lg); animation: popIn 0.25s ease; }
  .service-btn { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 10px 14px 12px; border-radius: 12px 12px 0 0; border: none; border-bottom: 3px solid transparent; cursor: pointer; transition: all 0.18s; font-family: 'DM Sans', sans-serif; color: rgba(255,255,255,0.8); background: transparent; min-width: 80px; }
  .service-btn:hover { background: rgba(255,255,255,0.1); color: #fff; }
  .service-btn.active { background: rgba(255,255,255,0.18); color: #fff; border-bottom-color: #fff; }
  .shipping-option { display: flex; align-items: center; gap: 12px; padding: 14px; border-radius: 12px; border: 2px solid var(--sand-dark); cursor: pointer; transition: all 0.18s; background: var(--white); }
  .shipping-option:hover { border-color: var(--green-mid); }
  .shipping-option.active { border-color: var(--green); background: var(--green-pale); }
  .shipping-option input[type="radio"] { accent-color: var(--green); cursor: pointer; }
  .question-chip { padding: 10px 14px; border-radius: 10px; border: 1.5px solid var(--sand-dark); background: #fff; color: var(--text-mid); font-size: 0.85rem; cursor: pointer; text-align: left; transition: all 0.18s; font-family: 'DM Sans', sans-serif; }
  .question-chip:hover { border-color: var(--green); color: var(--green); background: var(--green-pale); }
  .question-chip.active { border-color: var(--green); color: var(--green); background: var(--green-pale); font-weight: 600; }
`;

const SERVICES = [
  { id: "bazar", label: "Bazar věcí", icon: "🛍️" },
  { id: "veterinar", label: "Veterinární kliniky", icon: "🩺" },
  { id: "venceni", label: "Venčení", icon: "🦮" },
  { id: "hotel", label: "Psí hotely", icon: "🏨" },
  { id: "pojisteni", label: "Pojištění mazlíčka", icon: "🛡️" },
  { id: "partneri", label: "Partnerští prodejci", icon: "🤝" },
];

const CATS = [
  { id: "vse", label: "Vše", icon: "🐾" },
  { id: "vybaveni", label: "Vybavení", icon: "🏠" },
  { id: "krmivo", label: "Krmivo & pamlsky", icon: "🦴" },
  { id: "obleceni", label: "Oblečení", icon: "🧥" },
  { id: "hracky", label: "Hračky", icon: "🧸" },
  { id: "preprava", label: "Přeprava", icon: "📦" },
  { id: "pece", label: "Péče & hygiena", icon: "🧴" },
];

const ANIMALS = [
  { id: "vse", label: "Všechna zvířata" },
  { id: "pes", label: "🐕 Pes" },
  { id: "kočka", label: "🐈 Kočka" },
  { id: "hlodavec", label: "🐹 Hlodavec" },
  { id: "ryba", label: "🐠 Ryba" },
];

const COND_COLORS = {
  "nový": { bg: "#e3f2fd", color: "#0d47a1" }, "Nový": { bg: "#e3f2fd", color: "#0d47a1" },
  "jako nový": { bg: "#e8f5e9", color: "#1b5e20" }, "Jako nový": { bg: "#e8f5e9", color: "#1b5e20" },
  "dobrý": { bg: "#fff8e1", color: "#e65100" }, "Dobrý": { bg: "#fff8e1", color: "#e65100" },
  "použitý": { bg: "#fce4ec", color: "#880e4f" }, "Použitý": { bg: "#fce4ec", color: "#880e4f" },
};

const SHIPPING_OPTIONS = [
  { id: "personal", name: "Osobní odběr", price: 0, icon: "🤝", desc: "Domluveno přes platformu" },
  { id: "zasilkovna", name: "Zásilkovna", price: 79, icon: "📦", desc: "Do 48 hodin na výdejní místo" },
  { id: "ppl", name: "PPL balík", price: 119, icon: "🚚", desc: "Doručení na adresu, 1-2 dny" },
];

const PREDEFINED_QUESTIONS = [
  "Je zboží plně funkční / bez vad?",
  "Jak staré zboží je?",
  "Jsou součástí originální obal / krabice / příslušenství?",
  "Proč zboží prodáváš?",
  "Je cena konečná, nebo je prostor vyjednávat?",
  "Kdy je možné vyzvednout / odeslat?",
  "Bylo zboží někdy opravováno?",
];

const CONTACT_FILTER_REGEX = /(\+?\d[\d\s\-]{7,})|(\b\w+@\w+\.\w+)|(revolut|iban|paypal|\b(u[cč]et|bank|p[řr]evod|hotovost|kontakt|telefon|email|e-mail|mobil|whatsapp|messenger)\b)/i;

function CondBadge({ cond }) {
  const s = COND_COLORS[cond] || { bg: "#f5f5f5", color: "#555" };
  return <span style={{ background: s.bg, color: s.color, fontSize: "0.68rem", fontWeight: 700, padding: "3px 9px", borderRadius: 20, textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{cond}</span>;
}

function Card({ item, onOpen, onSave, delay }) {
  const discountedPrice = item.discount_percent ? Math.round(item.price * (1 - item.discount_percent / 100)) : null;
  const [hovered, setHovered] = useState(false);
  const catIcons = { vybaveni: "🏠", krmivo: "🦴", obleceni: "🧥", hracky: "🧸", preprava: "📦", pece: "🧴" };
  const catIcon = catIcons[item.cat || item.category] || "🐾";

  return (
    <div
      className="card"
      style={{ animationDelay: `${delay}ms`, transform: hovered ? "translateY(-6px)" : "translateY(0)", boxShadow: hovered ? "0 16px 48px rgba(44,80,58,0.18)" : "var(--shadow-sm)", transition: "all 0.22s ease" }}
      onClick={() => onOpen(item)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ height: 200, background: "linear-gradient(145deg, var(--green-pale), var(--sand))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "4rem", position: "relative", overflow: "hidden" }}>
        {item.foto_urls && item.foto_urls.length > 0
          ? <img src={item.foto_urls[0]} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0, transition: "transform 0.3s ease", transform: hovered ? "scale(1.04)" : "scale(1)" }} />
          : <span style={{ fontSize: "4rem", opacity: 0.4 }}>🐾</span>}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.15) 0%, transparent 50%)", pointerEvents: "none" }} />
        {item.discount_percent && <div style={{ position: "absolute", top: 12, left: 12, background: "#e07b39", color: "#fff", borderRadius: 20, padding: "4px 11px", fontSize: "0.75rem", fontWeight: 700, zIndex: 1, boxShadow: "0 2px 8px rgba(224,123,57,0.4)" }}>-{item.discount_percent}%</div>}
        {item.foto_urls && item.foto_urls.length > 1 && (
          <div style={{ position: "absolute", bottom: 10, left: 12, background: "rgba(0,0,0,0.55)", color: "#fff", borderRadius: 20, padding: "3px 9px", fontSize: "0.7rem", fontWeight: 600, zIndex: 1 }}>📷 {item.foto_urls.length}</div>
        )}
        <button onClick={e => { e.stopPropagation(); onSave(item.id); }} style={{ position: "absolute", top: 12, right: 12, background: item.saved ? "var(--green)" : "rgba(255,255,255,0.95)", border: "none", borderRadius: "50%", width: 36, height: 36, cursor: "pointer", fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.15)", transition: "all 0.2s", zIndex: 1, color: item.saved ? "#fff" : "var(--text-mid)" }}>
          {item.saved ? "♥" : "♡"}
        </button>
      </div>

      <div style={{ padding: "16px 18px 18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontSize: "0.72rem", color: "var(--text-light)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {catIcon} {(item.cat || item.category || "").replace("vybaveni", "Vybavení").replace("krmivo", "Krmivo").replace("obleceni", "Oblečení").replace("hracky", "Hračky").replace("preprava", "Přeprava").replace("pece", "Péče")}
          </span>
          {item.views > 0 && <span style={{ fontSize: "0.72rem", color: "var(--text-light)" }}>👁 {item.views}</span>}
        </div>
        <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text)", lineHeight: 1.35, marginBottom: 10, minHeight: 44, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{item.title}</div>
        <div style={{ fontSize: "0.78rem", color: "var(--text-light)", marginBottom: 12, display: "flex", alignItems: "center", gap: 4 }}>
          <span>📍 {item.city}</span>
          <span style={{ color: "var(--sand-dark)" }}>·</span>
          <span>{item.created_at ? new Date(item.created_at).toLocaleDateString("cs-CZ") : ""}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 10, borderTop: "1px solid var(--sand-dark)" }}>
          <div>
            {discountedPrice ? (
              <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                <span style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--green)", fontFamily: "'DM Serif Display', serif" }}>{discountedPrice} Kč</span>
                <span style={{ fontSize: "0.78rem", color: "var(--text-light)", textDecoration: "line-through" }}>{item.price} Kč</span>
              </div>
            ) : (
              <span style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--green)", fontFamily: "'DM Serif Display', serif" }}>{item.price} Kč</span>
            )}
          </div>
          <CondBadge cond={item.cond || item.condition} />
        </div>
      </div>
    </div>
  );
}

function ReportModal({ item, onClose, user }) {
  const [reason, setReason] = useState("");
  const [sent, setSent] = useState(false);
  const [saving, setSaving] = useState(false);

  const reasons = [
    "Podezření na podvod",
    "Falešný inzerát / nepravdivé informace",
    "Nevhodný obsah",
    "Prodej zakázaného zboží",
    "Spam nebo duplicitní inzerát",
    "Jiný důvod",
  ];

  const handleSend = async () => {
    if (!reason) return;
    setSaving(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      await fetch(`${supabaseUrl}/functions/v1/send-order-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${supabaseKey}` },
        body: JSON.stringify({
          sellerEmail: "horejsi.jakub7799@gmail.com",
          sellerName: "Admin",
          order: {
            _isNewRegistration: true,
            _registrantName: `NAHLASENY INZERAT: ${item.title}`,
            _registrantType: `Duvod: ${reason}`,
            _registrantTier: `Inzerat ID: ${item.id}`,
            buyer_email: user?.email || "anonymni",
            buyer_phone: "",
            buyer_address: `Prodejce: ${item.seller_name || item.seller_id}`,
          },
        }),
      });
      setSent(true);
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  return (
    <div className="overlay" onClick={onClose} style={{ zIndex: 300 }}>
      <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: "22px 24px 18px", borderBottom: "1px solid var(--sand-dark)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: "1.1rem", color: "var(--text)" }}>🚨 Nahlásit inzerát</h2>
          <button onClick={onClose} style={{ background: "var(--sand)", border: "none", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", fontSize: "0.9rem", color: "var(--text-mid)", fontWeight: 700 }}>✕</button>
        </div>
        <div style={{ padding: "20px 24px 24px" }}>
          {sent ? (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>✅</div>
              <p style={{ color: "var(--text-mid)", fontSize: "0.9rem" }}>Nahlášení odesláno. Prověříme to do 24 hodin.</p>
              <button className="btn-primary" style={{ marginTop: 16, width: "100%" }} onClick={onClose}>Zavřít</button>
            </div>
          ) : (
            <>
              <p style={{ color: "var(--text-mid)", fontSize: "0.85rem", marginBottom: 16, lineHeight: 1.6 }}>Proč nahlašuješ tento inzerát "<strong>{item.title}</strong>"?</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                {reasons.map(r => (
                  <button key={r} onClick={() => setReason(r)} style={{ padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${reason === r ? "var(--accent)" : "var(--sand-dark)"}`, background: reason === r ? "var(--accent-light)" : "#fff", color: reason === r ? "var(--accent)" : "var(--text-mid)", fontSize: "0.85rem", fontWeight: reason === r ? 600 : 400, cursor: "pointer", textAlign: "left", fontFamily: "'DM Sans', sans-serif" }}>{r}</button>
                ))}
              </div>
              <button onClick={handleSend} disabled={!reason || saving} className="btn-primary" style={{ width: "100%", opacity: !reason ? 0.5 : 1 }}>
                {saving ? "Odesílám..." : "Odeslat nahlášení"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function OfferModal({ item, onClose, user, onSuccess }) {
  const [offeredPrice, setOfferedPrice] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const itemPrice = item.discount_percent ? Math.round(item.price * (1 - item.discount_percent / 100)) : item.price;
  const suggested = [
    Math.round(itemPrice * 0.9),
    Math.round(itemPrice * 0.85),
    Math.round(itemPrice * 0.8),
    Math.round(itemPrice * 0.75),
  ];

  const handleSubmit = async () => {
    const price = parseInt(offeredPrice);
    if (!price || price <= 0) return setError("Zadej platnou cenu");
    if (price >= itemPrice) return setError(`Nabídka musí být nižší než ${itemPrice} Kč`);
    if (price < itemPrice * 0.3) return setError(`Nabídka je příliš nízká (min. ${Math.round(itemPrice * 0.3)} Kč)`);
    if (message && CONTACT_FILTER_REGEX.test(message)) {
      return setError("Zpráva nesmí obsahovat kontakty. Komunikuj přes platformu.");
    }

    setSaving(true);
    setError("");

    try {
      const { data: offer, error: offerError } = await supabase
        .from("offers")
        .insert({
          inzerat_id: item.id,
          buyer_id: user.id,
          seller_id: item.seller_id,
          original_price: itemPrice,
          offered_price: price,
          message: message.trim() || null,
          status: "pending",
        })
        .select()
        .single();

      if (offerError) throw offerError;

      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        await fetch(`${supabaseUrl}/functions/v1/send-order-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${supabaseKey}` },
          body: JSON.stringify({
            sellerEmail: item.seller_email || "horejsi.jakub7799@gmail.com",
            sellerName: item.seller_name || "Prodejce",
            order: {
              _isOffer: true,
              _itemTitle: item.title,
              _originalPrice: itemPrice,
              _offeredPrice: price,
              _message: message.trim() || "(bez zpravy)",
              _offerId: offer.id,
            },
          }),
        });
      } catch (e) { console.error(e); }

      onSuccess();
    } catch (err) {
      console.error(err);
      setError("Nepodařilo se odeslat nabídku.");
    }
    setSaving(false);
  };

  return (
    <div className="overlay" onClick={onClose} style={{ zIndex: 250 }}>
      <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: "22px 26px 18px", borderBottom: "1px solid var(--sand-dark)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: "1.25rem", color: "var(--text)" }}>💰 Nabídnout jinou cenu</h2>
          <button onClick={onClose} style={{ background: "var(--sand)", border: "none", borderRadius: "50%", width: 36, height: 36, cursor: "pointer", fontSize: "1rem", color: "var(--text-mid)", fontWeight: 700 }}>✕</button>
        </div>

        <div style={{ padding: "20px 26px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", gap: 12, padding: 14, background: "var(--green-pale)", borderRadius: 12 }}>
            <div style={{ width: 60, height: 60, borderRadius: 10, background: "var(--sand)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
              {item.foto_urls?.[0] ? <img src={item.foto_urls[0]} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span>🐾</span>}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "0.9rem", fontWeight: 600 }}>{item.title}</div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-mid)" }}>Původní cena: <strong>{itemPrice} Kč</strong></div>
            </div>
          </div>

          <div>
            <label className="label">Rychlá volba</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
              {suggested.map(s => (
                <button key={s} onClick={() => setOfferedPrice(s.toString())} style={{ padding: "10px", borderRadius: 10, border: `1.5px solid ${parseInt(offeredPrice) === s ? "var(--green)" : "var(--sand-dark)"}`, background: parseInt(offeredPrice) === s ? "var(--green-pale)" : "#fff", color: parseInt(offeredPrice) === s ? "var(--green)" : "var(--text)", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                  {s} Kč
                  <div style={{ fontSize: "0.65rem", color: "var(--text-light)", fontWeight: 400, marginTop: 2 }}>
                    -{Math.round((1 - s / itemPrice) * 100)}%
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Moje nabídka (Kč)</label>
            <input
              className="input-field"
              type="number"
              placeholder={`Např. ${Math.round(itemPrice * 0.85)}`}
              value={offeredPrice}
              onChange={e => setOfferedPrice(e.target.value)}
              style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--green)" }}
            />
          </div>

          <div>
            <label className="label">Krátká zpráva prodejci (volitelné)</label>
            <textarea
              className="input-field"
              style={{ minHeight: 60, resize: "vertical" }}
              maxLength={200}
              placeholder="Např. Jsem z Prahy, můžu rychle vyzvednout..."
              value={message}
              onChange={e => setMessage(e.target.value)}
            />
            <div style={{ fontSize: "0.7rem", color: "var(--text-light)", marginTop: 4, textAlign: "right" }}>
              {message.length}/200
            </div>
          </div>

          {error && <div style={{ background: "#fee", color: "#b91c1c", padding: "10px 14px", borderRadius: 10, fontSize: "0.85rem" }}>{error}</div>}

          <div style={{ background: "#f0f7f4", border: "1px solid #b7d9c7", borderRadius: 10, padding: "10px 14px", fontSize: "0.75rem", color: "#2d5a3d", lineHeight: 1.5 }}>
            ⏱️ Prodejce má <strong>48 hodin</strong> na odpověď. Pokud přijme, budeš moct zboží koupit za tuto cenu.
          </div>

          <button className="btn-primary" style={{ width: "100%", padding: "14px", fontSize: "1rem" }} onClick={handleSubmit} disabled={saving}>
            {saving ? "Odesílám..." : `Odeslat nabídku ${offeredPrice ? offeredPrice + " Kč" : ""}`}
          </button>
        </div>
      </div>
    </div>
  );
}

function QuestionModal({ item, onClose, user, onSuccess }) {
  const [selectedQuestion, setSelectedQuestion] = useState("");
  const [customQuestion, setCustomQuestion] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    const question = selectedQuestion || customQuestion.trim();
    if (!question) return setError("Vyber otázku ze seznamu nebo napiš vlastní");
    if (question.length < 5) return setError("Otázka je příliš krátká");
    if (question.length > 200) return setError("Otázka je příliš dlouhá (max 200 znaků)");
    if (CONTACT_FILTER_REGEX.test(question)) {
      return setError("Otázka nesmí obsahovat kontakty. Komunikuj přes platformu.");
    }

    setSaving(true);
    setError("");

    try {
      const { data, error: qError } = await supabase
        .from("questions")
        .insert({
          inzerat_id: item.id,
          buyer_id: user.id,
          seller_id: item.seller_id,
          question_type: selectedQuestion ? "predefined" : "custom",
          question: question,
        })
        .select()
        .single();

      if (qError) throw qError;

      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        await fetch(`${supabaseUrl}/functions/v1/send-order-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${supabaseKey}` },
          body: JSON.stringify({
            sellerEmail: item.seller_email || "horejsi.jakub7799@gmail.com",
            sellerName: item.seller_name || "Prodejce",
            order: {
              _isQuestion: true,
              _itemTitle: item.title,
              _question: question,
              _questionId: data.id,
            },
          }),
        });
      } catch (e) { console.error(e); }

      onSuccess();
    } catch (err) {
      console.error(err);
      setError("Nepodařilo se odeslat otázku.");
    }
    setSaving(false);
  };

  return (
    <div className="overlay" onClick={onClose} style={{ zIndex: 250 }}>
      <div className="modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: "22px 26px 18px", borderBottom: "1px solid var(--sand-dark)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: "1.25rem", color: "var(--text)" }}>❓ Zeptat se prodejce</h2>
          <button onClick={onClose} style={{ background: "var(--sand)", border: "none", borderRadius: "50%", width: 36, height: 36, cursor: "pointer", fontSize: "1rem", color: "var(--text-mid)", fontWeight: 700 }}>✕</button>
        </div>

        <div style={{ padding: "20px 26px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
          <p style={{ fontSize: "0.85rem", color: "var(--text-mid)" }}>
            Vyber otázku ze seznamu nebo napiš vlastní:
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {PREDEFINED_QUESTIONS.map(q => (
              <button
                key={q}
                className={`question-chip ${selectedQuestion === q ? "active" : ""}`}
                onClick={() => { setSelectedQuestion(q); setCustomQuestion(""); }}
              >
                {q}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ flex: 1, height: 1, background: "var(--sand-dark)" }} />
            <span style={{ fontSize: "0.75rem", color: "var(--text-light)", fontWeight: 600 }}>NEBO</span>
            <div style={{ flex: 1, height: 1, background: "var(--sand-dark)" }} />
          </div>

          <div>
            <label className="label">Vlastní otázka</label>
            <textarea
              className="input-field"
              style={{ minHeight: 80, resize: "vertical" }}
              maxLength={200}
              placeholder="Napiš svou otázku (bez kontaktů)..."
              value={customQuestion}
              onChange={e => { setCustomQuestion(e.target.value); setSelectedQuestion(""); }}
            />
            <div style={{ fontSize: "0.7rem", color: "var(--text-light)", marginTop: 4, textAlign: "right" }}>
              {customQuestion.length}/200
            </div>
          </div>

          {error && <div style={{ background: "#fee", color: "#b91c1c", padding: "10px 14px", borderRadius: 10, fontSize: "0.85rem" }}>{error}</div>}

          <div style={{ background: "#fff8e1", border: "1px solid #ffecb3", borderRadius: 10, padding: "10px 14px", fontSize: "0.75rem", color: "#7a5b00", lineHeight: 1.5 }}>
            ⚠️ <strong>Bez kontaktů:</strong> Telefon, email a platební údaje jsou zakázané. Komunikace a platba výhradně přes Pet Market.
          </div>

          <button className="btn-primary" style={{ width: "100%", padding: "14px", fontSize: "1rem" }} onClick={handleSubmit} disabled={saving}>
            {saving ? "Odesílám..." : "Odeslat otázku"}
          </button>
        </div>
      </div>
    </div>
  );
}

function BuyModal({ item, onClose, user, onSuccess, acceptedOfferPrice }) {
  const [form, setForm] = useState({
    name: user?.user_metadata?.full_name || "",
    email: user?.email || "",
    phone: "",
    address: "",
  });
  const [shipping, setShipping] = useState("personal");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const selectedShipping = SHIPPING_OPTIONS.find(s => s.id === shipping);
  const itemPrice = acceptedOfferPrice || (item.discount_percent ? Math.round(item.price * (1 - item.discount_percent / 100)) : item.price);
  const totalPrice = itemPrice + (selectedShipping?.price || 0);

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
          seller_id: item.seller_id,
          buyer_name: form.name,
          buyer_email: form.email,
          buyer_phone: form.phone,
          buyer_address: shipping === "personal" ? "Osobni odber" : form.address,
          shipping_name: selectedShipping.name,
          shipping_price: selectedShipping.price,
          total_products: itemPrice,
          total_price: totalPrice,
          status: "pending_payment",
        })
        .select()
        .single();

      if (orderError) throw orderError;

      await supabase.from("order_items").insert({
        order_id: order.id,
        inzerat_id: item.id,
        title: item.title,
        price: itemPrice,
        quantity: 1,
      });

      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        await fetch(`${supabaseUrl}/functions/v1/send-order-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${supabaseKey}` },
          body: JSON.stringify({
            sellerEmail: item.seller_email || "horejsi.jakub7799@gmail.com",
            sellerName: item.seller_name || "Prodejce",
            order: {
              id: order.id,
              item_title: item.title,
              item_price: itemPrice,
              shipping_name: selectedShipping.name,
              total_price: totalPrice,
              _hideBuyerContact: true,
            },
          }),
        });
      } catch (e) { console.error(e); }

      onSuccess(order);
    } catch (err) {
      console.error(err);
      setError("Nepodařilo se vytvořit objednávku.");
    }
    setSaving(false);
  };

  return (
    <div className="overlay" onClick={onClose} style={{ zIndex: 250 }}>
      <div className="modal" style={{ maxWidth: 540 }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: "22px 26px 18px", borderBottom: "1px solid var(--sand-dark)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: "1.3rem", color: "var(--text)" }}>Dokončit objednávku</h2>
          <button onClick={onClose} style={{ background: "var(--sand)", border: "none", borderRadius: "50%", width: 36, height: 36, cursor: "pointer", fontSize: "1rem", color: "var(--text-mid)", fontWeight: 700 }}>✕</button>
        </div>

        <div style={{ padding: "20px 26px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", gap: 12, padding: 14, background: "var(--green-pale)", borderRadius: 12, border: "1px solid var(--green-light)" }}>
            <div style={{ width: 60, height: 60, borderRadius: 10, background: "var(--sand)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
              {item.foto_urls?.[0] ? <img src={item.foto_urls[0]} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span>🐾</span>}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "0.9rem", fontWeight: 600 }}>{item.title}</div>
              {acceptedOfferPrice && (
                <div style={{ fontSize: "0.75rem", color: "var(--accent)", fontWeight: 600, marginTop: 2 }}>✨ Přijatá nabídka</div>
              )}
              <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--green)", marginTop: 4, fontFamily: "'DM Serif Display', serif" }}>{itemPrice} Kč</div>
            </div>
          </div>

          <div>
            <label className="label">Kontaktní údaje</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input className="input-field" placeholder="Jméno a příjmení *" value={form.name} onChange={e => set("name", e.target.value)} />
              <input className="input-field" type="email" placeholder="Email *" value={form.email} onChange={e => set("email", e.target.value)} />
              <input className="input-field" type="tel" placeholder="Telefon *" value={form.phone} onChange={e => set("phone", e.target.value)} />
            </div>
          </div>

          <div>
            <label className="label">Způsob dopravy</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {SHIPPING_OPTIONS.map(opt => (
                <label key={opt.id} className={`shipping-option ${shipping === opt.id ? "active" : ""}`}>
                  <input type="radio" name="shipping" checked={shipping === opt.id} onChange={() => setShipping(opt.id)} />
                  <div style={{ fontSize: "1.4rem" }}>{opt.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.9rem", fontWeight: 600 }}>{opt.name}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-light)" }}>{opt.desc}</div>
                  </div>
                  <div style={{ fontSize: "0.95rem", fontWeight: 700, color: opt.price === 0 ? "var(--green)" : "var(--text)" }}>
                    {opt.price === 0 ? "Zdarma" : `${opt.price} Kč`}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {shipping !== "personal" && (
            <div>
              <label className="label">Doručovací adresa *</label>
              <textarea
                className="input-field"
                style={{ minHeight: 70, resize: "vertical" }}
                placeholder="Ulice, číslo, město, PSČ"
                value={form.address}
                onChange={e => set("address", e.target.value)}
              />
            </div>
          )}

          <div style={{ background: "var(--sand)", borderRadius: 12, padding: 16, border: "1px solid var(--sand-dark)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: "0.88rem", color: "var(--text-mid)" }}>
              <span>Produkt</span>
              <span>{itemPrice} Kč</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: "0.88rem", color: "var(--text-mid)" }}>
              <span>Doprava</span>
              <span>{selectedShipping?.price === 0 ? "Zdarma" : `${selectedShipping?.price} Kč`}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 10, borderTop: "1px solid var(--sand-dark)", fontSize: "1.1rem", fontWeight: 700 }}>
              <span>Celkem</span>
              <span style={{ color: "var(--green)", fontFamily: "'DM Serif Display', serif", fontSize: "1.4rem" }}>{totalPrice} Kč</span>
            </div>
          </div>

          {error && <div style={{ background: "#fee", color: "#b91c1c", padding: "10px 14px", borderRadius: 10, fontSize: "0.85rem" }}>{error}</div>}

          <div style={{ background: "#f0f7f4", border: "1px solid #b7d9c7", borderRadius: 10, padding: "10px 14px", fontSize: "0.78rem", color: "#2d5a3d", lineHeight: 1.5 }}>
            🔒 <strong>Pet Market Shield</strong> — peníze uvolníme prodejci až po potvrzení doručení. Pokud zboží nedorazí, peníze vrátíme.
          </div>

          <button className="btn-primary" style={{ width: "100%", padding: "14px", fontSize: "1rem" }} onClick={handleSubmit} disabled={saving}>
            {saving ? "Odesílám..." : `✓ Potvrdit objednávku za ${totalPrice} Kč`}
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailModal({ item, onClose, onSave, user, onAuthRequired, onView, onReport, onBuy, onOffer, onAsk }) {
  const [fotoIdx, setFotoIdx] = useState(0);

  useEffect(() => {
    if (item?.id && item?.seller_id) onView(item.id);
  }, [item?.id]);

  if (!item) return null;
  const fotos = item.foto_urls && item.foto_urls.length > 0 ? item.foto_urls : null;
  const discountedPrice = item.discount_percent ? Math.round(item.price * (1 - item.discount_percent / 100)) : null;
  const displayPrice = discountedPrice || item.price;
  const isOwner = user?.id === item.seller_id;

  const requireAuth = (fn) => () => {
    if (!user) { onClose(); onAuthRequired(); return; }
    fn(item);
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div style={{ height: 400, background: "linear-gradient(145deg, var(--green-pale), var(--sand))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "6rem", position: "relative", borderRadius: "22px 22px 0 0", overflow: "hidden" }}>
          {fotos ? <img src={fotos[fotoIdx]} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "contain" }} /> : "🐾"}
          {item.discount_percent && <div style={{ position: "absolute", top: 14, left: 14, background: "#e07b39", color: "#fff", borderRadius: 20, padding: "4px 12px", fontSize: "0.85rem", fontWeight: 700 }}>-{item.discount_percent}%</div>}
          {fotos && fotos.length > 1 && (
            <>
              <button onClick={e => { e.stopPropagation(); setFotoIdx(i => (i - 1 + fotos.length) % fotos.length); }} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.45)", border: "none", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", fontSize: "1.2rem", fontWeight: 700, color: "#fff" }}>‹</button>
              <button onClick={e => { e.stopPropagation(); setFotoIdx(i => (i + 1) % fotos.length); }} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.45)", border: "none", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", fontSize: "1.2rem", fontWeight: 700, color: "#fff" }}>›</button>
              <div style={{ position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 5 }}>
                {fotos.map((_, i) => <div key={i} onClick={e => { e.stopPropagation(); setFotoIdx(i); }} style={{ width: 7, height: 7, borderRadius: "50%", cursor: "pointer", background: i === fotoIdx ? "#fff" : "rgba(255,255,255,0.5)" }} />)}
              </div>
            </>
          )}
          <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, background: "rgba(255,255,255,0.9)", border: "none", borderRadius: "50%", width: 38, height: 38, cursor: "pointer", fontSize: "1.1rem", color: "var(--text-mid)", fontWeight: 700 }}>✕</button>
        </div>
        <div style={{ padding: "24px 26px 28px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, gap: 12 }}>
            <h2 style={{ fontSize: "1.25rem", color: "var(--text)", lineHeight: 1.3 }}>{item.title}</h2>
            <CondBadge cond={item.cond || item.condition} />
          </div>
          <div style={{ marginBottom: 14 }}>
            {discountedPrice ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <span style={{ fontSize: "2rem", fontWeight: 700, color: "var(--green)", fontFamily: "'DM Serif Display', serif" }}>{discountedPrice} Kč</span>
                <span style={{ fontSize: "1rem", color: "var(--text-light)", textDecoration: "line-through" }}>{item.price} Kč</span>
              </div>
            ) : (
              <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--green)", fontFamily: "'DM Serif Display', serif" }}>{item.price} Kč</div>
            )}
          </div>
          <p style={{ color: "var(--text-mid)", fontSize: "0.92rem", lineHeight: 1.65, marginBottom: 18 }}>{item.desc || item.description}</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
            {[
              `📍 ${item.city}`,
              `👤 ${item.seller_name || "Prodejce"}`,
              item.views > 0 ? `👁 ${item.views}` : null,
            ].filter(Boolean).map(tag => (
              <span key={tag} style={{ background: "var(--sand)", border: "1px solid var(--sand-dark)", borderRadius: 20, padding: "5px 12px", fontSize: "0.78rem", color: "var(--text-mid)", fontWeight: 500 }}>{tag}</span>
            ))}
          </div>

          <div style={{ background: "#f0f7f4", border: "1px solid #b7d9c7", borderRadius: 10, padding: "10px 14px", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: "1rem", flexShrink: 0 }}>🔒</span>
            <span style={{ fontSize: "0.78rem", color: "#2d5a3d", lineHeight: 1.5 }}>
              <strong>Pet Market Shield.</strong> Peníze uvolníme prodejci až po potvrzení doručení. Komunikace a platba výhradně přes platformu.
            </span>
          </div>

          {!isOwner ? (
            <>
              <button
                className="btn-primary"
                style={{ width: "100%", padding: "14px", fontSize: "1rem", marginBottom: 10 }}
                onClick={requireAuth(onBuy)}
              >
                🛒 Koupit za {displayPrice} Kč
              </button>

              <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
                <button className="btn-secondary" style={{ flex: 1 }} onClick={requireAuth(onOffer)}>
                  💰 Nabídnout cenu
                </button>
                <button className="btn-secondary" style={{ flex: 1 }} onClick={requireAuth(onAsk)}>
                  ❓ Zeptat se
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => onSave(item.id)}
                  style={{ padding: "10px 14px", color: item.saved ? "var(--accent)" : "var(--green)", borderColor: item.saved ? "var(--accent)" : "var(--green)" }}
                >
                  {item.saved ? "♥" : "♡"}
                </button>
              </div>
            </>
          ) : (
            <div style={{ background: "var(--green-light)", color: "var(--green)", borderRadius: 10, padding: "12px", textAlign: "center", fontSize: "0.9rem", fontWeight: 600 }}>
              📋 Toto je tvůj inzerát
            </div>
          )}

          {!isOwner && (
            <button onClick={() => onReport(item)} style={{ width: "100%", background: "none", border: "none", color: "var(--text-light)", fontSize: "0.75rem", cursor: "pointer", marginTop: 4, fontFamily: "'DM Sans', sans-serif", textDecoration: "underline" }}>
              🚨 Nahlásit inzerát
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function AddModal({ onClose, onAdd }) {
  const { user, profile } = useAuth();
  const [f, setF] = useState({ title: "", price: "", cat: "vybaveni", animal: "pes", cond: "dobrý", city: "", desc: "" });
  const [fotky, setFotky] = useState([]);
  const [fotkyPreviews, setFotkyPreviews] = useState([]);
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  const compressImage = (file) => new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const img = new Image();
    img.onload = () => {
      const maxSize = 800;
      let w = img.width, h = img.height;
      if (w > h && w > maxSize) { h = (h * maxSize) / w; w = maxSize; }
      else if (h > maxSize) { w = (w * maxSize) / h; h = maxSize; }
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      canvas.toBlob((blob) => resolve(new File([blob], file.name, { type: "image/jpeg" })), "image/jpeg", 0.75);
    };
    img.src = URL.createObjectURL(file);
  });

  const handleFotky = async (e) => {
    const files = Array.from(e.target.files);
    const compressed = await Promise.all(files.map(compressImage));
    const newFotky = [...fotky, ...compressed].slice(0, 5);
    setFotky(newFotky);
    setFotkyPreviews(newFotky.map(f => URL.createObjectURL(f)));
  };

  const submit = async () => {
    if (!f.title.trim() || !f.price || !f.city.trim()) { alert("Vyplň prosím název, cenu a město."); return; }
    if (!user) { alert("Musíš být přihlášen."); return; }
    setSaving(true);
    try {
      const fotoUrls = [];
      for (const fotka of fotky) {
        const fileName = `${user.id}/${Date.now()}_${fotka.name}`;
        const { error: uploadError } = await supabase.storage.from("inzeraty").upload(fileName, fotka);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("inzeraty").getPublicUrl(fileName);
        fotoUrls.push(urlData.publicUrl);
      }
      const { error } = await supabase.from("inzeraty").insert({
        title: f.title,
        price: parseInt(f.price),
        city: f.city,
        description: f.desc,
        category: f.cat,
        animal: f.animal,
        condition: f.cond,
        foto_urls: fotoUrls,
        seller_id: user.id,
        seller_name: profile?.name || user.email
      });
      if (error) throw error;
      onAdd({ ...f, id: Date.now(), price: parseInt(f.price), foto_urls: fotoUrls });
      onClose();
    } catch (err) { alert("Chyba: " + err.message); }
    setSaving(false);
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: "22px 24px 0", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--sand-dark)", paddingBottom: 16 }}>
          <h2 style={{ fontSize: "1.35rem", color: "var(--text)" }}>Přidat inzerát</h2>
          <button onClick={onClose} style={{ background: "var(--sand)", border: "none", borderRadius: "50%", width: 36, height: 36, cursor: "pointer", fontSize: "1rem", color: "var(--text-mid)", fontWeight: 700 }}>✕</button>
        </div>
        <div style={{ padding: "20px 24px 26px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label className="label">Fotky (max. 5)</label>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
              {fotkyPreviews.map((src, i) => (
                <div key={i} style={{ position: "relative", width: 80, height: 80 }}>
                  <img src={src} style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 10, border: "1.5px solid var(--sand-dark)" }} />
                  <button onClick={() => { const nf = fotky.filter((_, j) => j !== i); setFotky(nf); setFotkyPreviews(nf.map(f => URL.createObjectURL(f))); }} style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%", background: "#b91c1c", color: "#fff", border: "none", cursor: "pointer", fontSize: "0.7rem", fontWeight: 700 }}>✕</button>
                </div>
              ))}
              {fotky.length < 5 && (
                <label style={{ width: 80, height: 80, borderRadius: 10, border: "2px dashed var(--sand-dark)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text-light)", fontSize: "0.75rem", background: "var(--sand)", gap: 4 }}>
                  <span style={{ fontSize: "1.5rem" }}>📷</span>Přidat
                  <input type="file" accept="image/*" multiple onChange={handleFotky} style={{ display: "none" }} />
                </label>
              )}
            </div>
          </div>
          <div>
            <label className="label">Název inzerátu *</label>
            <input className="input-field" value={f.title} onChange={e => set("title", e.target.value)} placeholder="Např. Pelíšek pro psa, vel. M" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label className="label">Cena (Kč) *</label>
              <input className="input-field" type="number" value={f.price} onChange={e => set("price", e.target.value)} placeholder="350" />
            </div>
            <div>
              <label className="label">Město *</label>
              <input className="input-field" value={f.city} onChange={e => set("city", e.target.value)} placeholder="Praha" />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <div>
              <label className="label">Kategorie</label>
              <select className="input-field" style={{ cursor: "pointer" }} value={f.cat} onChange={e => set("cat", e.target.value)}>
                <option value="vybaveni">Vybavení</option>
                <option value="krmivo">Krmivo & pamlsky</option>
                <option value="obleceni">Oblečení</option>
                <option value="hracky">Hračky</option>
                <option value="preprava">Přeprava</option>
                <option value="pece">Péče & hygiena</option>
              </select>
            </div>
            <div>
              <label className="label">Zvíře</label>
              <select className="input-field" style={{ cursor: "pointer" }} value={f.animal} onChange={e => set("animal", e.target.value)}>
                <option value="pes">Pes</option>
                <option value="kočka">Kočka</option>
                <option value="hlodavec">Hlodavec</option>
                <option value="ryba">Ryba</option>
                <option value="ptak">Pták</option>
                <option value="jine">Jiné</option>
              </select>
            </div>
            <div>
              <label className="label">Stav</label>
              <select className="input-field" style={{ cursor: "pointer" }} value={f.cond} onChange={e => set("cond", e.target.value)}>
                <option value="nový">Nový</option>
                <option value="jako nový">Jako nový</option>
                <option value="dobrý">Dobrý</option>
                <option value="použitý">Použitý</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Popis</label>
            <textarea className="input-field" style={{ minHeight: 80, resize: "vertical" }} value={f.desc} onChange={e => set("desc", e.target.value)} placeholder="Stav, rozměry, důvod prodeje..." />
          </div>
          <button className="btn-primary" style={{ width: "100%", padding: "14px", fontSize: "1rem" }} onClick={submit} disabled={saving}>{saving ? "Zveřejňuji..." : "✓ Zveřejnit inzerát"}</button>
        </div>
      </div>
    </div>
  );
}

function ComingSoonModal({ service, onClose }) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 420, textAlign: "center" }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: "40px 32px 36px" }}>
          <div style={{ fontSize: "3.5rem", marginBottom: 16 }}>{service.icon}</div>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.5rem", color: "var(--text)", marginBottom: 12 }}>{service.label}</h2>
          <p style={{ color: "var(--text-mid)", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: 24 }}>Tato sekce je ve vývoji a brzy bude k dispozici.</p>
          <button className="btn-primary" style={{ width: "100%" }} onClick={onClose}>Zpět na bazar</button>
        </div>
      </div>
    </div>
  );
}

function SuccessModal({ title, message, onClose }) {
  return (
    <div className="overlay" onClick={onClose} style={{ zIndex: 300 }}>
      <div className="modal" style={{ maxWidth: 420, textAlign: "center" }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: "40px 32px 36px" }}>
          <div style={{ fontSize: "3.5rem", marginBottom: 16 }}>✅</div>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.5rem", color: "var(--text)", marginBottom: 12 }}>{title}</h2>
          <p style={{ color: "var(--text-mid)", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: 24 }}>{message}</p>
          <button className="btn-primary" style={{ width: "100%" }} onClick={onClose}>Zpět na bazar</button>
        </div>
      </div>
    </div>
  );
}

export default function PetMarket() {
  const [items, setItems] = useState([]);
  const [activeService, setActiveService] = useState("bazar");
  const [comingSoon, setComingSoon] = useState(null);
  const [cat, setCat] = useState("vse");
  const [animal, setAnimal] = useState("vse");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [maxPrice, setMaxPrice] = useState(1000);
  const [selected, setSelected] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [toast, setToast] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [reportItem, setReportItem] = useState(null);
  const [buyItem, setBuyItem] = useState(null);
  const [offerItem, setOfferItem] = useState(null);
  const [askItem, setAskItem] = useState(null);
  const [success, setSuccess] = useState(null);
  const { user, profile, signOut } = useAuth();
  const [isApprovedSeller, setIsApprovedSeller] = useState(false);
  const [isPartner, setIsPartner] = useState(false);

  useEffect(() => {
    if (!user) { setIsApprovedSeller(false); setIsPartner(false); return; }
    supabase.from("partner_profiles").select("id").eq("user_id", user.id).eq("type", "seller").eq("approved", true).maybeSingle()
      .then(({ data }) => setIsApprovedSeller(!!data));
    supabase.from("partner_profiles").select("id").eq("user_id", user.id).eq("approved", true).in("type", ["hotel", "vencitel"]).maybeSingle()
      .then(({ data }) => {
        if (data) { setIsPartner(true); return; }
        supabase.from("vet_profiles").select("id").eq("user_id", user.id).eq("approved", true).maybeSingle()
          .then(({ data: vetData }) => setIsPartner(!!vetData));
      });
  }, [user]);

  useEffect(() => {
    supabase.from("inzeraty").select("*").order("created_at", { ascending: false })
      .then(({ data, error }) => { if (!error) setItems(data); });
  }, []);

  const handleView = async (id) => {
    if (selected?.seller_id === user?.id) return;
    await supabase.rpc("increment_views", { inzerat_id: id });
    setItems(ls => ls.map(i => i.id === id ? { ...i, views: (i.views || 0) + 1 } : i));
    if (selected?.id === id) setSelected(s => s ? { ...s, views: (s.views || 0) + 1 } : s);
  };

  const handleServiceClick = (service) => {
    if (service.id === "bazar") setActiveService("bazar");
    else if (service.id === "veterinar") window.location.href = "/veterinari";
    else if (service.id === "hotel") window.location.href = "/hotely";
    else if (service.id === "venceni") window.location.href = "/venceni";
    else if (service.id === "partneri") window.location.href = "/shop";
    else if (service.id === "pojisteni") window.location.href = "/pojisteni";
    else setComingSoon(service);
  };

  const toast_ = msg => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const handleSave = id => {
    const item = items.find(i => i.id === id);
    setItems(ls => ls.map(i => i.id === id ? { ...i, saved: !i.saved } : i));
    if (selected?.id === id) setSelected(s => s ? { ...s, saved: !s.saved } : s);
    toast_(item?.saved ? "Odstraněno z oblíbených" : "♥ Přidáno do oblíbených");
  };

  const handleAdd = newItem => { setItems(ls => [newItem, ...ls]); toast_("🎉 Tvůj inzerát byl přidán!"); };

  const filtered = items
    .filter(i => { if (cat === "vse") return true; return (i.cat || i.category || "").toLowerCase() === cat.toLowerCase(); })
    .filter(i => animal === "vse" || (i.animal || "").toLowerCase() === animal.toLowerCase())
    .filter(i => i.price <= maxPrice)
    .filter(i => !search || i.title.toLowerCase().includes(search.toLowerCase()) || i.city.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sort === "price_asc" ? a.price - b.price : sort === "price_desc" ? b.price - a.price : new Date(b.created_at) - new Date(a.created_at));

  const savedCount = items.filter(i => i.saved).length;
  const userName = profile?.full_name || profile?.name || user?.email?.split("@")[0] || "Účet";

  return (
    <div style={{ minHeight: "100vh", background: "var(--sand)" }}>
      <style>{CSS}</style>

      <nav style={{ background: "var(--white)", borderBottom: "1px solid var(--sand-dark)", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 1px 12px rgba(44,80,58,0.07)" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", height: 68, gap: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0, marginRight: 4 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: "var(--green)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem" }}>🐾</div>
            <div>
              <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: "1.25rem", color: "var(--text)", letterSpacing: "-0.02em" }}>Pet Market</div>
              <div style={{ fontSize: "0.6rem", color: "var(--text-light)", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: -1 }}>tržiště pro mazlíčky</div>
            </div>
          </div>
          <div style={{ flex: 1, position: "relative" }}>
            <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", fontSize: "1rem", opacity: 0.45 }}>🔍</span>
            <input className="input-field" value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 38, borderRadius: 30, background: "var(--sand)" }} placeholder="Hledat pelíšek, granule, klec…" />
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexShrink: 0 }}>
            {savedCount > 0 && <div style={{ background: "var(--green-light)", color: "var(--green)", borderRadius: 20, padding: "6px 14px", fontSize: "0.8rem", fontWeight: 700, border: "1px solid #b7d9c7" }}>♥ {savedCount}</div>}
            {user ? (
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button className="btn-secondary" style={{ padding: "8px 16px" }} onClick={() => window.location.href = isPartner ? "/partner/dashboard" : "/profil"}>
                  {isPartner ? "🏨" : "👤"} {userName}
                </button>
                {isApprovedSeller && (
                  <button className="btn-secondary" style={{ padding: "8px 16px", borderColor: "var(--green)", color: "var(--green)" }} onClick={() => window.location.href = "/seller/dashboard"}>🏪 Můj obchod</button>
                )}
                <button className="btn-secondary" style={{ padding: "8px 14px", fontSize: "0.8rem", borderColor: "var(--sand-dark)", color: "var(--text-mid)" }} onClick={signOut}>Odhlásit</button>
              </div>
            ) : (
              <button className="btn-secondary" style={{ padding: "8px 16px" }} onClick={() => setShowAuth(true)}>Přihlásit se</button>
            )}
            <button className="btn-secondary" onClick={() => window.location.href = "/partneri"} style={{ padding: "10px 20px" }}>🤝 Staň se partnerem</button>
            <button className="btn-primary" onClick={() => setShowAdd(true)} style={{ padding: "10px 20px" }}>+ Prodat</button>
          </div>
        </div>
      </nav>

      <div style={{ background: "linear-gradient(135deg, var(--green) 0%, #3a7d60 100%)" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "18px 24px 14px", textAlign: "center" }}>
          <h1 style={{ color: "var(--white)", fontSize: "clamp(1.2rem,2.2vw,1.6rem)", marginBottom: 4, letterSpacing: "-0.02em", lineHeight: 1.25 }}>
            Vše pro tvého mazlíčka — z druhé ruky
          </h1>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.8rem", marginBottom: 14, lineHeight: 1.5 }}>
            Kupuj, prodávej, najdi veterináře nebo hotel.
          </p>

          <div style={{ display: "flex", background: "var(--white)", borderRadius: 50, overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.15)", maxWidth: 480, margin: "0 auto 14px" }}>
            <span style={{ display: "flex", alignItems: "center", padding: "0 12px", color: "var(--text-light)", fontSize: "0.95rem", flexShrink: 0 }}>🔍</span>
            <input className="input-field" value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, border: "none", background: "transparent", borderRadius: 0, padding: "9px 4px", minWidth: 0, fontSize: "0.85rem" }} placeholder="Hledat pelíšek, granule, klec…" />
            <button className="btn-primary" style={{ borderRadius: 50, margin: 4, padding: "8px 16px", fontSize: "0.82rem", flexShrink: 0 }} onClick={() => { }}>Hledat</button>
          </div>

          <div style={{ display: "flex", gap: 16, alignItems: "center", justifyContent: "center", flexWrap: "wrap" }}>
            {[
              { value: `${items.length}+`, label: "inzerátů" },
              { value: "350+", label: "prodejců" },
              { value: "47", label: "měst" },
              { value: "4.8 ★", label: "hodnocení", gold: true },
            ].map((s, i, arr) => (
              <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ color: s.gold ? "#f5c97a" : "var(--white)", fontSize: "0.85rem", fontWeight: 700 }}>{s.value}</div>
                  <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.62rem" }}>{s.label}</div>
                </div>
                {i < arr.length - 1 && <div style={{ width: 1, height: 18, background: "rgba(255,255,255,0.2)" }} />}
              </div>
            ))}
          </div>
        </div>

        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "10px 24px 0", display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "center" }}>
          {SERVICES.map(service => (
            <button key={service.id} className={`service-btn ${activeService === service.id ? "active" : ""}`} onClick={() => handleServiceClick(service)}>
              <span style={{ fontSize: "1.4rem" }}>{service.icon}</span>
              <span style={{ fontSize: "0.68rem", fontWeight: 600, textAlign: "center", lineHeight: 1.2, maxWidth: 80 }}>{service.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: "var(--white)", borderBottom: "1px solid var(--sand-dark)", padding: "14px 24px" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto" }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
            {CATS.map(c => <button key={c.id} className={`pill ${cat === c.id ? "pill-active" : "pill-outline"}`} onClick={() => setCat(c.id)} style={{ fontSize: "0.85rem", padding: "7px 16px" }}>{c.icon} {c.label}</button>)}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            {ANIMALS.map(a => <button key={a.id} className={`pill ${animal === a.id ? "pill-dark" : "pill-dark-outline"}`} onClick={() => setAnimal(a.id)} style={{ fontSize: "0.78rem", padding: "5px 13px" }}>{a.label}</button>)}
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: "0.78rem", color: "var(--text-light)", whiteSpace: "nowrap" }}>Do <strong style={{ color: "var(--green)" }}>{maxPrice} Kč</strong></span>
                <input type="range" min={50} max={2000} step={50} value={maxPrice} onChange={e => setMaxPrice(+e.target.value)} style={{ width: 90, accentColor: "var(--green)", cursor: "pointer" }} />
              </div>
              <select className="input-field" value={sort} onChange={e => setSort(e.target.value)} style={{ width: "auto", padding: "6px 12px", borderRadius: 20, cursor: "pointer", fontSize: "0.8rem" }}>
                <option value="newest">Nejnovější</option>
                <option value="price_asc">Cena: nízká → vysoká</option>
                <option value="price_desc">Cena: vysoká → nízká</option>
              </select>
              <span style={{ fontSize: "0.8rem", color: "var(--text-light)", whiteSpace: "nowrap" }}>{filtered.length} výsledků</span>
            </div>
          </div>
        </div>
      </div>

      <main style={{ maxWidth: 1180, margin: "0 auto", padding: "24px 24px 48px" }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "70px 20px", color: "var(--text-light)" }}>
            <div style={{ fontSize: "3.5rem", marginBottom: 16 }}>🔍</div>
            <h3 style={{ fontFamily: "'DM Serif Display',serif", color: "var(--text-mid)", marginBottom: 8 }}>Žádné inzeráty nenalezeny</h3>
            <p style={{ fontSize: "0.9rem" }}>Zkus upravit filtry nebo přidej vlastní inzerát.</p>
            <button className="btn-primary" style={{ marginTop: 20 }} onClick={() => setShowAdd(true)}>+ Přidat inzerát</button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 24 }}>
            {filtered.map((item, i) => <Card key={item.id} item={item} onOpen={setSelected} onSave={handleSave} delay={i * 40} />)}
          </div>
        )}
      </main>

      {selected && <DetailModal
        item={selected}
        onClose={() => setSelected(null)}
        onSave={handleSave}
        user={user}
        onAuthRequired={() => setShowAuth(true)}
        onView={handleView}
        onReport={item => { setSelected(null); setReportItem(item); }}
        onBuy={item => { setSelected(null); setBuyItem(item); }}
        onOffer={item => { setSelected(null); setOfferItem(item); }}
        onAsk={item => { setSelected(null); setAskItem(item); }}
      />}
      {buyItem && <BuyModal item={buyItem} onClose={() => setBuyItem(null)} user={user} onSuccess={(order) => { setBuyItem(null); setSuccess({ title: "Objednávka odeslána!", message: `Prodejce byl informován. Číslo objednávky: ${order?.id?.slice(0, 8)}` }); }} />}
      {offerItem && <OfferModal item={offerItem} onClose={() => setOfferItem(null)} user={user} onSuccess={() => { setOfferItem(null); setSuccess({ title: "Nabídka odeslána!", message: "Prodejce má 48 hodin na odpověď. Upozorníme tě emailem." }); }} />}
      {askItem && <QuestionModal item={askItem} onClose={() => setAskItem(null)} user={user} onSuccess={() => { setAskItem(null); setSuccess({ title: "Otázka odeslána!", message: "Prodejce ti odpoví co nejdříve. Upozorníme tě emailem." }); }} />}
      {success && <SuccessModal {...success} onClose={() => setSuccess(null)} />}
      {reportItem && <ReportModal item={reportItem} onClose={() => setReportItem(null)} user={user} />}
      {showAdd && <AddModal onClose={() => setShowAdd(false)} onAdd={handleAdd} />}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onAuthSuccess={() => setShowAuth(false)} />}
      {comingSoon && <ComingSoonModal service={comingSoon} onClose={() => setComingSoon(null)} />}

      {toast && (
        <div style={{ position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", background: "var(--text)", color: "var(--white)", borderRadius: 30, padding: "12px 26px", fontSize: "0.88rem", fontWeight: 600, zIndex: 300, whiteSpace: "nowrap", boxShadow: "0 8px 28px rgba(0,0,0,0.2)", animation: "toastIn 0.3s ease" }}>{toast}</div>
      )}

      <footer style={{ background: "var(--text)", color: "rgba(255,255,255,0.5)", padding: "24px", textAlign: "center", fontSize: "0.8rem" }}>
        <span style={{ fontFamily: "'DM Serif Display',serif", color: "rgba(255,255,255,0.8)", fontSize: "1rem" }}>Pet Market</span>
        {" "}· Tržiště pro mazlíčky · Celá ČR · {new Date().getFullYear()}
      </footer>
    </div>
  );
}