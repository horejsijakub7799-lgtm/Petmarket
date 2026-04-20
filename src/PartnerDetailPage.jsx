import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "./supabase";

const TYPE_CONFIG = {
  hotel: { icon: "🏨", label: "Psí hotel", color: "#1a4fa0", light: "#e8eef8", cta: "Zavolat hotelu", ctaIcon: "📞", showReservation: true, priceLabel: "Cena za noc", priceKey: "price_per_night" },
  vencitel: { icon: "🦮", label: "Venčitel psů", color: "#2d6a4f", light: "#e8f5ef", cta: "Kontaktovat venčitele", ctaIcon: "📞", showReservation: true, priceLabel: "Cena za venčení", priceKey: "price_per_walk" },
  veterinar: { icon: "🩺", label: "Veterinární klinika", color: "#b91c1c", light: "#fce4ec", cta: "Zavolat klinice", ctaIcon: "📞", showReservation: false },
  prodejce: { icon: "🛍️", label: "Partnerský prodejce", color: "#e07b39", light: "#fdf0e6", cta: "Kontaktovat prodejce", ctaIcon: "📞", showReservation: false },
};

function StarRating({ value, onChange, readonly = false }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i}
          onClick={() => !readonly && onChange && onChange(i)}
          onMouseEnter={() => !readonly && setHover(i)}
          onMouseLeave={() => !readonly && setHover(0)}
          style={{ fontSize: readonly ? "1rem" : "1.4rem", cursor: readonly ? "default" : "pointer", color: i <= (hover || value) ? "#e07b39" : "#ede8e0", transition: "color 0.1s" }}>★</span>
      ))}
    </div>
  );
}

export default function PartnerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [partner, setPartner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fotoIdx, setFotoIdx] = useState(0);
  const [reviews, setReviews] = useState([]);

  const [showReservationForm, setShowReservationForm] = useState(false);
  const [resForm, setResForm] = useState({ name: "", email: "", phone: "", date_from: "", date_to: "", num_dogs: 1, notes: "" });
  const [resSaving, setResSaving] = useState(false);
  const [resMsg, setResMsg] = useState("");
  const [resSuccess, setResSuccess] = useState(false);

  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({ name: "", rating: 5, text: "" });
  const [reviewSaving, setReviewSaving] = useState(false);
  const [reviewMsg, setReviewMsg] = useState("");

  useEffect(() => { fetchPartner(); }, [id]);

  const fetchPartner = async () => {
    let { data } = await supabase.from("partner_profiles").select("*").eq("id", id).eq("approved", true).single();
    if (!data) {
      const { data: vet } = await supabase.from("vet_profiles").select("*").eq("id", id).eq("approved", true).single();
      if (vet) data = { ...vet, type: "veterinar", name: vet.clinic_name };
    }
    setPartner(data);
    setLoading(false);
    if (data) fetchReviews(data.id);
  };

  const fetchReviews = async (partnerId) => {
    const { data } = await supabase.from("reviews").select("*").eq("partner_id", partnerId).order("created_at", { ascending: false });
    if (data) setReviews(data);
  };

  const calcNights = () => {
    if (!resForm.date_from || !resForm.date_to) return 0;
    const diff = new Date(resForm.date_to) - new Date(resForm.date_from);
    return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)));
  };

  const handleReservation = async () => {
    const cfg = TYPE_CONFIG[partner.type] || TYPE_CONFIG.hotel;
    const nights = calcNights();
    if (!resForm.name || !resForm.email || !resForm.date_from || !resForm.date_to) {
      setResMsg("⚠️ Vyplň všechna povinná pole."); return;
    }
    if (nights <= 0) { setResMsg("⚠️ Datum odjezdu musí být po datu příjezdu."); return; }
    setResSaving(true); setResMsg("");

    const unitPrice = partner?.metadata?.[cfg.priceKey] || 0;
    const totalPrice = unitPrice * nights * resForm.num_dogs;

    const { error } = await supabase.from("reservations").insert({
      partner_id: partner.id,
      customer_name: resForm.name,
      customer_email: resForm.email,
      customer_phone: resForm.phone,
      date_from: resForm.date_from,
      date_to: resForm.date_to,
      num_dogs: resForm.num_dogs,
      total_price: totalPrice,
      notes: resForm.notes,
      status: "pending",
    });

    if (error) { setResMsg("❌ Chyba: " + error.message); setResSaving(false); return; }

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const emailPayload = {
        _isReservation: true,
        _partnerName: partner.name,
        _partnerPhone: partner.phone,
        _partnerAddress: `${partner.address || ""}, ${partner.city}`,
        _partnerConditions: partner.conditions || "",
        _dateFrom: resForm.date_from,
        _dateTo: resForm.date_to,
        _numDogs: resForm.num_dogs,
        _nights: nights,
        _totalPrice: totalPrice,
        buyer_name: resForm.name,
        buyer_email: resForm.email,
        buyer_phone: resForm.phone || "",
        notes: resForm.notes || "",
        buyer_address: "",
        total_price: totalPrice,
        shipping_name: "",
        shipping_price: 0,
        order_items: [],
      };
      await fetch(`${supabaseUrl}/functions/v1/send-order-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${supabaseKey}` },
        body: JSON.stringify({ sellerEmail: resForm.email, sellerName: resForm.name, order: emailPayload }),
      });
      if (partner.email) {
        await fetch(`${supabaseUrl}/functions/v1/send-order-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${supabaseKey}` },
          body: JSON.stringify({ sellerEmail: partner.email, sellerName: partner.name, order: { ...emailPayload, _isReservation: false, _isPartnerReservationNotification: true } }),
        });
      }
    } catch (e) { console.error("Email failed:", e); }

    setResSaving(false);
    setResSuccess(true);
  };

  const handleReview = async () => {
    if (!reviewForm.name || !reviewForm.text) { setReviewMsg("⚠️ Vyplň jméno a text recenze."); return; }
    setReviewSaving(true);
    const { error } = await supabase.from("reviews").insert({
      partner_id: partner.id,
      customer_name: reviewForm.name,
      rating: reviewForm.rating,
      text: reviewForm.text,
    });
    if (error) { setReviewMsg("❌ Chyba: " + error.message); setReviewSaving(false); return; }
    setReviewMsg("✅ Recenze přidána!");
    setReviewForm({ name: "", rating: 5, text: "" });
    setShowReviewForm(false);
    fetchReviews(partner.id);
    setReviewSaving(false);
    setTimeout(() => setReviewMsg(""), 3000);
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif", background: "#f7f4ef" }}>
      <div style={{ textAlign: "center", color: "#8a9e92" }}>
        <div style={{ fontSize: "2rem", marginBottom: 12 }}>🐾</div>
        <p>Načítám profil...</p>
      </div>
    </div>
  );

  if (!partner) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif", background: "#f7f4ef" }}>
      <div style={{ textAlign: "center", color: "#8a9e92" }}>
        <div style={{ fontSize: "3rem", marginBottom: 12 }}>😕</div>
        <p style={{ marginBottom: 20 }}>Profil nenalezen.</p>
        <button onClick={() => navigate(-1)} style={{ background: "#2d6a4f", color: "#fff", border: "none", borderRadius: 10, padding: "12px 24px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>← Zpět</button>
      </div>
    </div>
  );

  const cfg = TYPE_CONFIG[partner.type] || TYPE_CONFIG.hotel;
  const fotos = partner.cover_photo ? [partner.cover_photo, ...(partner.foto_urls || [])] : (partner.foto_urls || []);
  const unitPrice = partner?.metadata?.[cfg.priceKey] || 0;
  const nights = calcNights();
  const totalPrice = unitPrice * Math.max(nights, 1) * resForm.num_dogs;
  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;

  // Otevírací doba — veterináři mají přímo v opening_hours, ostatní v metadata.opening_hours
  const oteviraciDoba = partner.opening_hours || partner.metadata?.opening_hours || null;
  // Tým lékařů
  const tym = partner.metadata?.tym || [];

  const inputStyle = { width: "100%", border: "1.5px solid #ede8e0", borderRadius: 10, padding: "10px 14px", fontSize: "0.88rem", outline: "none", fontFamily: "'DM Sans', sans-serif", background: "#f7f4ef", boxSizing: "border-box", color: "#1c2b22" };
  const labelStyle = { fontSize: "0.72rem", fontWeight: 600, color: "#8a9e92", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 5 };

  return (
    <div style={{ minHeight: "100vh", background: "#f7f4ef", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600;700&display=swap');`}</style>

      <nav style={{ background: "#fff", borderBottom: "1px solid #ede8e0", height: 64, display: "flex", alignItems: "center", padding: "0 32px", gap: 16, position: "sticky", top: 0, zIndex: 100, boxShadow: "0 1px 12px rgba(44,80,58,0.07)" }}>
        <button onClick={() => navigate(-1)} style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer" }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: "#2d6a4f", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>🐾</div>
          <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.15rem", color: "#1c2b22" }}>Pet Market</span>
        </button>
        <span style={{ color: "#8a9e92", fontSize: "0.85rem" }}>/ {cfg.label}</span>
        {partner.tier === "premium" && (
          <span style={{ background: "#fdf0e6", color: "#e07b39", border: "1px solid #f5c99a", borderRadius: 20, padding: "3px 12px", fontSize: "0.75rem", fontWeight: 700 }}>⭐ Premium</span>
        )}
      </nav>

      <div style={{ position: "relative", height: 320, background: "linear-gradient(145deg, #e8f5ef, #f2faf6)", overflow: "hidden" }}>
        {fotos.length > 0 ? (
          <>
            <img src={fotos[fotoIdx]} alt={partner.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            {fotos.length > 1 && (
              <>
                <button onClick={() => setFotoIdx(i => (i - 1 + fotos.length) % fotos.length)} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.45)", border: "none", borderRadius: "50%", width: 40, height: 40, cursor: "pointer", fontSize: "1.3rem", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>
                <button onClick={() => setFotoIdx(i => (i + 1) % fotos.length)} style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.45)", border: "none", borderRadius: "50%", width: 40, height: 40, cursor: "pointer", fontSize: "1.3rem", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>›</button>
                <div style={{ position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 6 }}>
                  {fotos.map((_, i) => <div key={i} onClick={() => setFotoIdx(i)} style={{ width: i === fotoIdx ? 20 : 8, height: 8, borderRadius: 4, background: i === fotoIdx ? "#fff" : "rgba(255,255,255,0.5)", cursor: "pointer", transition: "width 0.2s" }} />)}
                </div>
              </>
            )}
          </>
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "6rem" }}>{cfg.icon}</div>
        )}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 60%)" }} />
        <div style={{ position: "absolute", bottom: 24, left: 32, right: 32 }}>
          <span style={{ background: cfg.color, color: "#fff", borderRadius: 20, padding: "4px 12px", fontSize: "0.75rem", fontWeight: 700 }}>{cfg.icon} {cfg.label}</span>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(1.4rem, 3vw, 2rem)", color: "#fff", margin: "8px 0 4px", textShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>{partner.name}</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ color: "rgba(255,255,255,0.85)", fontSize: "0.9rem" }}>📍 {partner.address ? `${partner.address}, ` : ""}{partner.city}</span>
            {avgRating && <span style={{ background: "rgba(255,255,255,0.2)", color: "#fff", borderRadius: 20, padding: "2px 10px", fontSize: "0.8rem", fontWeight: 600 }}>⭐ {avgRating} ({reviews.length})</span>}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24, alignItems: "start" }}>

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {partner.description && (
              <div style={{ background: "#fff", borderRadius: 16, padding: "24px 28px", border: "1px solid #ede8e0" }}>
                <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.2rem", color: "#1c2b22", marginBottom: 14 }}>O nás</h2>
                <p style={{ color: "#4a5e52", fontSize: "0.92rem", lineHeight: 1.7, margin: 0 }}>{partner.description}</p>
              </div>
            )}

            {/* VENČITEL — specifické info */}
            {partner.type === "vencitel" && (partner.metadata?.experience || partner.metadata?.area_radius_km || partner.metadata?.gps_tracking || partner.metadata?.max_dogs) && (
              <div style={{ background: "#fff", borderRadius: 16, padding: "24px 28px", border: "1px solid #ede8e0" }}>
                <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.2rem", color: "#1c2b22", marginBottom: 16 }}>🦮 O venčiteli</h2>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: partner.metadata?.experience ? 16 : 0 }}>
                  {partner.metadata?.price_per_walk && (
                    <div style={{ background: "#e8f5ef", borderRadius: 12, padding: "14px 16px" }}>
                      <div style={{ fontSize: "0.7rem", color: "#2d6a4f", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Cena za procházku</div>
                      <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "#2d6a4f", fontFamily: "'DM Serif Display', serif" }}>{partner.metadata.price_per_walk} Kč</div>
                    </div>
                  )}
                  {partner.metadata?.walk_duration_min && (
                    <div style={{ background: "#f7f4ef", borderRadius: 12, padding: "14px 16px" }}>
                      <div style={{ fontSize: "0.7rem", color: "#4a5e52", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Délka procházky</div>
                      <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "#1c2b22", fontFamily: "'DM Serif Display', serif" }}>{partner.metadata.walk_duration_min} min</div>
                    </div>
                  )}
                  {partner.metadata?.area_radius_km && (
                    <div style={{ background: "#f7f4ef", borderRadius: 12, padding: "14px 16px" }}>
                      <div style={{ fontSize: "0.7rem", color: "#4a5e52", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Oblast působení</div>
                      <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "#1c2b22", fontFamily: "'DM Serif Display', serif" }}>{partner.metadata.area_radius_km} km</div>
                    </div>
                  )}
                  {partner.metadata?.max_dogs && (
                    <div style={{ background: "#f7f4ef", borderRadius: 12, padding: "14px 16px" }}>
                      <div style={{ fontSize: "0.7rem", color: "#4a5e52", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Max. psů najednou</div>
                      <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "#1c2b22", fontFamily: "'DM Serif Display', serif" }}>{partner.metadata.max_dogs}</div>
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {partner.metadata?.gps_tracking && (
                    <span style={{ background: "#e8f5ef", color: "#2d6a4f", border: "1px solid #b7d9c7", borderRadius: 20, padding: "6px 14px", fontSize: "0.82rem", fontWeight: 700 }}>📍 GPS tracking</span>
                  )}
                  {partner.metadata?.group_walks && (
                    <span style={{ background: "#e8f5ef", color: "#2d6a4f", border: "1px solid #b7d9c7", borderRadius: 20, padding: "6px 14px", fontSize: "0.82rem", fontWeight: 700 }}>👥 Skupinové procházky</span>
                  )}
                </div>
                {partner.metadata?.experience && (
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #ede8e0" }}>
                    <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#8a9e92", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Zkušenosti & certifikáty</div>
                    <p style={{ color: "#4a5e52", fontSize: "0.9rem", lineHeight: 1.7, margin: 0 }}>{partner.metadata.experience}</p>
                  </div>
                )}
              </div>
            )}

            {partner.metadata?.sluzby?.length > 0 && (
              <div style={{ background: "#fff", borderRadius: 16, padding: "24px 28px", border: "1px solid #ede8e0" }}>
                <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.2rem", color: "#1c2b22", marginBottom: 14 }}>Nabízené služby</h2>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {partner.metadata.sluzby.map(s => (
                    <span key={s} style={{ background: cfg.light, color: cfg.color, border: `1px solid ${cfg.color}30`, borderRadius: 20, padding: "6px 14px", fontSize: "0.82rem", fontWeight: 600 }}>{s}</span>
                  ))}
                </div>
              </div>
            )}

            {partner.specializations?.length > 0 && (
              <div style={{ background: "#fff", borderRadius: 16, padding: "24px 28px", border: "1px solid #ede8e0" }}>
                <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.2rem", color: "#1c2b22", marginBottom: 14 }}>Specializace</h2>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {partner.specializations.map(s => (
                    <span key={s} style={{ background: "#fce4ec", color: "#b91c1c", borderRadius: 20, padding: "6px 14px", fontSize: "0.82rem", fontWeight: 600 }}>{s}</span>
                  ))}
                </div>
              </div>
            )}

            {partner.metadata?.zvirata?.length > 0 && (
              <div style={{ background: "#fff", borderRadius: 16, padding: "24px 28px", border: "1px solid #ede8e0" }}>
                <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.2rem", color: "#1c2b22", marginBottom: 14 }}>Přijímá zvířata</h2>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {partner.metadata.zvirata.map(s => (
                    <span key={s} style={{ background: "#f7f4ef", color: "#4a5e52", border: "1px solid #ede8e0", borderRadius: 20, padding: "6px 14px", fontSize: "0.82rem" }}>{s}</span>
                  ))}
                </div>
              </div>
            )}

            {/* TÝM LÉKAŘŮ */}
            {tym.length > 0 && (
              <div style={{ background: "#fff", borderRadius: 16, padding: "24px 28px", border: "1px solid #ede8e0" }}>
                <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.2rem", color: "#1c2b22", marginBottom: 14 }}>👨‍⚕️ Náš tým</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {tym.map((lekar, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "#f7f4ef", borderRadius: 12 }}>
                      {lekar.foto ? (
                        <img src={lekar.foto} style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "2px solid #b91c1c" }} />
                      ) : (
                        <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#fce4ec", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", flexShrink: 0 }}>👨‍⚕️</div>
                      )}
                      <div>
                        <div style={{ fontWeight: 700, color: "#1c2b22", fontSize: "0.92rem" }}>{lekar.titul} {lekar.jmeno}</div>
                        {lekar.specializace && <div style={{ fontSize: "0.78rem", color: "#8a9e92", marginTop: 2 }}>{lekar.specializace}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* OTEVÍRACÍ DOBA */}
            {oteviraciDoba && (
              <div style={{ background: "#fff", borderRadius: 16, padding: "24px 28px", border: "1px solid #ede8e0" }}>
                <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.2rem", color: "#1c2b22", marginBottom: 14 }}>Otevírací doba</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {["Po", "Út", "St", "Čt", "Pá", "So", "Ne"].map(den => {
                    const h = oteviraciDoba[den]; if (!h) return null;
                    return (
                      <div key={den} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem", padding: "8px 12px", borderRadius: 8, background: h.closed ? "#fce4ec" : "#f7f4ef" }}>
                        <span style={{ fontWeight: 600, color: "#1c2b22", width: 32 }}>{den}</span>
                        <span style={{ color: h.closed ? "#b91c1c" : "#4a5e52" }}>{h.closed ? "Zavřeno" : `${h.open} – ${h.close}`}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {partner.conditions && (
              <div style={{ background: "#fff8e1", borderRadius: 16, padding: "24px 28px", border: "1px solid #f5c99a" }}>
                <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.2rem", color: "#1c2b22", marginBottom: 14 }}>📋 Podmínky a instrukce</h2>
                <p style={{ color: "#4a5e52", fontSize: "0.92rem", lineHeight: 1.7, margin: 0, whiteSpace: "pre-line" }}>{partner.conditions}</p>
              </div>
            )}

            {fotos.length > 1 && (
              <div style={{ background: "#fff", borderRadius: 16, padding: "24px 28px", border: "1px solid #ede8e0" }}>
                <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.2rem", color: "#1c2b22", marginBottom: 14 }}>Fotogalerie</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 8 }}>
                  {fotos.map((url, i) => (
                    <div key={i} onClick={() => setFotoIdx(i)} style={{ aspectRatio: "1", borderRadius: 10, overflow: "hidden", cursor: "pointer", border: i === fotoIdx ? `2px solid ${cfg.color}` : "2px solid transparent" }}>
                      <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ background: "#fff", borderRadius: 16, padding: "24px 28px", border: "1px solid #ede8e0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.2rem", color: "#1c2b22", margin: 0 }}>
                  Hodnocení zákazníků
                  {avgRating && <span style={{ fontSize: "0.9rem", fontWeight: 400, color: "#8a9e92", marginLeft: 8 }}>⭐ {avgRating} ({reviews.length} recenzí)</span>}
                </h2>
                <button onClick={() => setShowReviewForm(!showReviewForm)} style={{ background: cfg.light, color: cfg.color, border: `1.5px solid ${cfg.color}30`, borderRadius: 8, padding: "7px 14px", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                  {showReviewForm ? "Zrušit" : "+ Přidat recenzi"}
                </button>
              </div>

              {showReviewForm && (
                <div style={{ background: "#f7f4ef", borderRadius: 12, padding: "20px", marginBottom: 20 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div><label style={labelStyle}>Vaše jméno *</label><input style={inputStyle} value={reviewForm.name} onChange={e => setReviewForm(f => ({ ...f, name: e.target.value }))} placeholder="Jan Novák" /></div>
                    <div>
                      <label style={labelStyle}>Hodnocení *</label>
                      <StarRating value={reviewForm.rating} onChange={v => setReviewForm(f => ({ ...f, rating: v }))} />
                    </div>
                    <div><label style={labelStyle}>Recenze *</label><textarea style={{ ...inputStyle, minHeight: 80, resize: "vertical" }} value={reviewForm.text} onChange={e => setReviewForm(f => ({ ...f, text: e.target.value }))} placeholder="Popište vaši zkušenost..." /></div>
                    {reviewMsg && <div style={{ fontSize: "0.85rem", color: reviewMsg.includes("❌") ? "#b91c1c" : "#1b5e20" }}>{reviewMsg}</div>}
                    <button onClick={handleReview} disabled={reviewSaving} style={{ background: cfg.color, color: "#fff", border: "none", borderRadius: 10, padding: "11px", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                      {reviewSaving ? "Ukládám..." : "✓ Odeslat recenzi"}
                    </button>
                  </div>
                </div>
              )}

              {reviewMsg && !showReviewForm && <div style={{ marginBottom: 12, fontSize: "0.85rem", color: "#1b5e20" }}>{reviewMsg}</div>}

              {reviews.length === 0 ? (
                <div style={{ textAlign: "center", padding: "24px", color: "#8a9e92", fontSize: "0.88rem" }}>Zatím žádné recenze. Buď první!</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {reviews.map(r => (
                    <div key={r.id} style={{ borderBottom: "1px solid #f7f4ef", paddingBottom: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <div style={{ fontWeight: 600, color: "#1c2b22", fontSize: "0.9rem" }}>{r.customer_name}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <StarRating value={r.rating} readonly />
                          <span style={{ fontSize: "0.75rem", color: "#8a9e92" }}>{new Date(r.created_at).toLocaleDateString("cs-CZ")}</span>
                        </div>
                      </div>
                      <p style={{ color: "#4a5e52", fontSize: "0.88rem", lineHeight: 1.6, margin: 0 }}>{r.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16, position: "sticky", top: 80 }}>

            {cfg.showReservation && unitPrice > 0 && !resSuccess && (
              <div style={{ background: "#fff", borderRadius: 16, padding: "24px", border: `2px solid ${cfg.color}30` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.1rem", color: "#1c2b22", margin: 0 }}>Rezervovat</h2>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.3rem", fontWeight: 700, color: cfg.color }}>{unitPrice} Kč</div>
                    <div style={{ fontSize: "0.72rem", color: "#8a9e92" }}>{cfg.priceLabel}</div>
                  </div>
                </div>

                {!showReservationForm ? (
                  <button onClick={() => setShowReservationForm(true)} style={{ width: "100%", background: cfg.color, color: "#fff", border: "none", borderRadius: 10, padding: "13px", fontSize: "0.95rem", fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                    📅 {partner.type === "vencitel" ? "Objednat procházku" : "Rezervovat termín"}
                  </button>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {partner.type === "vencitel" ? (
                      <div>
                        <label style={labelStyle}>Datum procházky *</label>
                        <input type="date" style={inputStyle} value={resForm.date_from} min={new Date().toISOString().split("T")[0]} onChange={e => setResForm(f => ({ ...f, date_from: e.target.value, date_to: e.target.value }))} />
                      </div>
                    ) : (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <div><label style={labelStyle}>Příjezd *</label><input type="date" style={inputStyle} value={resForm.date_from} min={new Date().toISOString().split("T")[0]} onChange={e => setResForm(f => ({ ...f, date_from: e.target.value }))} /></div>
                        <div><label style={labelStyle}>Odjezd *</label><input type="date" style={inputStyle} value={resForm.date_to} min={resForm.date_from || new Date().toISOString().split("T")[0]} onChange={e => setResForm(f => ({ ...f, date_to: e.target.value }))} /></div>
                      </div>
                    )}
                    <div>
                      <label style={labelStyle}>Počet psů</label>
                      <select style={{ ...inputStyle, cursor: "pointer" }} value={resForm.num_dogs} onChange={e => setResForm(f => ({ ...f, num_dogs: parseInt(e.target.value) }))}>
                        {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} {n === 1 ? "pes" : n < 5 ? "psi" : "psů"}</option>)}
                      </select>
                    </div>
                    {partner.type === "vencitel" && unitPrice > 0 && (
                      <div style={{ background: cfg.light, borderRadius: 10, padding: "12px 14px" }}>
                        <div style={{ fontSize: "0.82rem", color: "#4a5e52", marginBottom: 4 }}>{unitPrice} Kč × {resForm.num_dogs} {resForm.num_dogs === 1 ? "pes" : "psů"}</div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, color: cfg.color, fontSize: "1rem" }}>
                          <span>Celkem</span><span>{unitPrice * resForm.num_dogs} Kč</span>
                        </div>
                      </div>
                    )}
                    {partner.type !== "vencitel" && nights > 0 && (
                      <div style={{ background: cfg.light, borderRadius: 10, padding: "12px 14px" }}>
                        <div style={{ fontSize: "0.82rem", color: "#4a5e52", marginBottom: 4 }}>{unitPrice} Kč × {nights} {nights === 1 ? "noc" : nights < 5 ? "noci" : "nocí"} × {resForm.num_dogs} {resForm.num_dogs === 1 ? "pes" : "psů"}</div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, color: cfg.color, fontSize: "1rem" }}>
                          <span>Celkem</span><span>{totalPrice} Kč</span>
                        </div>
                      </div>
                    )}
                    <div><label style={labelStyle}>Jméno a příjmení *</label><input style={inputStyle} value={resForm.name} onChange={e => setResForm(f => ({ ...f, name: e.target.value }))} placeholder="Jana Nováková" /></div>
                    <div><label style={labelStyle}>Email *</label><input type="email" style={inputStyle} value={resForm.email} onChange={e => setResForm(f => ({ ...f, email: e.target.value }))} placeholder="jana@email.cz" /></div>
                    <div><label style={labelStyle}>Telefon</label><input style={inputStyle} value={resForm.phone} onChange={e => setResForm(f => ({ ...f, phone: e.target.value }))} placeholder="+420 777 888 999" /></div>
                    <div><label style={labelStyle}>Poznámka</label><textarea style={{ ...inputStyle, minHeight: 60, resize: "vertical" }} value={resForm.notes} onChange={e => setResForm(f => ({ ...f, notes: e.target.value }))} placeholder="Speciální požadavky..." /></div>
                    {resMsg && <div style={{ fontSize: "0.85rem", color: "#b91c1c" }}>{resMsg}</div>}
                    <button onClick={handleReservation} disabled={resSaving} style={{ width: "100%", background: resSaving ? "#b5cec0" : cfg.color, color: "#fff", border: "none", borderRadius: 10, padding: "13px", fontSize: "0.95rem", fontWeight: 700, cursor: resSaving ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                      {resSaving ? "Odesílám..." : `✓ Odeslat rezervaci (${totalPrice} Kč)`}
                    </button>
                    <button onClick={() => setShowReservationForm(false)} style={{ background: "none", border: "none", color: "#8a9e92", fontSize: "0.82rem", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Zrušit</button>
                  </div>
                )}
              </div>
            )}

            {resSuccess && (
              <div style={{ background: "#e8f5ef", borderRadius: 16, padding: "24px", border: "2px solid #b7d9c7", textAlign: "center" }}>
                <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>🎉</div>
                <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.1rem", color: "#1c2b22", marginBottom: 8 }}>Rezervace odeslána!</h3>
                <p style={{ color: "#4a5e52", fontSize: "0.88rem", lineHeight: 1.6, margin: "0 0 16px" }}>Potvrzení bylo odesláno na <strong>{resForm.email}</strong>. Partner vás brzy kontaktuje.</p>
                <button onClick={() => { setResSuccess(false); setResForm({ name: "", email: "", phone: "", date_from: "", date_to: "", num_dogs: 1, notes: "" }); setShowReservationForm(false); }} style={{ background: "#2d6a4f", color: "#fff", border: "none", borderRadius: 8, padding: "9px 18px", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Nová rezervace</button>
              </div>
            )}

            <div style={{ background: "#fff", borderRadius: 16, padding: "24px", border: "1px solid #ede8e0" }}>
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.1rem", color: "#1c2b22", marginBottom: 16 }}>Kontakt</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                {partner.phone && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "0.88rem", color: "#4a5e52" }}>
                    <span style={{ width: 32, height: 32, borderRadius: 8, background: cfg.light, display: "flex", alignItems: "center", justifyContent: "center" }}>📞</span>
                    {partner.phone}
                  </div>
                )}
                {partner.address && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "0.88rem", color: "#4a5e52" }}>
                    <span style={{ width: 32, height: 32, borderRadius: 8, background: cfg.light, display: "flex", alignItems: "center", justifyContent: "center" }}>📍</span>
                    {partner.address}, {partner.city}
                  </div>
                )}
                {(partner.web || partner.website) && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "0.88rem", color: "#4a5e52" }}>
                    <span style={{ width: 32, height: 32, borderRadius: 8, background: cfg.light, display: "flex", alignItems: "center", justifyContent: "center" }}>🌐</span>
                    <a href={(partner.web || partner.website).startsWith("http") ? (partner.web || partner.website) : `https://${partner.web || partner.website}`} target="_blank" rel="noopener noreferrer" style={{ color: cfg.color, textDecoration: "none", fontWeight: 600 }}>{partner.web || partner.website}</a>
                  </div>
                )}
              </div>
              {partner.phone && (
                <button onClick={() => window.open(`tel:${partner.phone}`)} style={{ width: "100%", background: cfg.color, color: "#fff", border: "none", borderRadius: 10, padding: "13px", fontSize: "0.95rem", fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", marginBottom: 10 }}>
                  {cfg.ctaIcon} {cfg.cta}
                </button>
              )}
              {(partner.web || partner.website) && (
                <a href={(partner.web || partner.website).startsWith("http") ? (partner.web || partner.website) : `https://${partner.web || partner.website}`} target="_blank" rel="noopener noreferrer" style={{ display: "block", width: "100%", background: "#f7f4ef", color: cfg.color, border: `1.5px solid ${cfg.color}40`, borderRadius: 10, padding: "11px", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", textAlign: "center", textDecoration: "none", boxSizing: "border-box" }}>
                  🌐 Navštívit web
                </a>
              )}
            </div>

            {(partner.metadata?.capacity || unitPrice > 0) && (
              <div style={{ background: "#fff", borderRadius: 16, padding: "20px 24px", border: "1px solid #ede8e0" }}>
                <h3 style={{ fontSize: "0.88rem", fontWeight: 700, color: "#1c2b22", marginBottom: 12 }}>Informace</h3>
                {partner.metadata?.capacity && <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "#4a5e52", padding: "6px 0", borderBottom: "1px solid #f7f4ef" }}><span>Kapacita</span><strong>{partner.metadata.capacity} psů</strong></div>}
                {unitPrice > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "#4a5e52", padding: "6px 0" }}><span>{cfg.priceLabel}</span><strong style={{ color: cfg.color }}>{unitPrice} Kč</strong></div>}
              </div>
            )}

            <div style={{ background: "#e8f5ef", borderRadius: 12, padding: "14px 16px", fontSize: "0.78rem", color: "#2d6a4f", textAlign: "center" }}>
              ✓ Ověřený partner Pet Market
            </div>
          </div>
        </div>
      </div>

      <footer style={{ background: "#1c2b22", color: "rgba(255,255,255,0.5)", padding: "24px", textAlign: "center", fontSize: "0.8rem", marginTop: 32 }}>
        <span style={{ fontFamily: "'DM Serif Display', serif", color: "rgba(255,255,255,0.8)", fontSize: "1rem" }}>Pet Market</span>
        {" "}· Tržiště pro mazlíčky · Celá ČR · {new Date().getFullYear()}
      </footer>
    </div>
  );
}