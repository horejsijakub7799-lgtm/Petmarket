import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./useAuth";
import { supabase } from "./supabase";

const statusColor = {
  pending:  { bg: "#fff8e1", color: "#e65100", label: "Čeká na schválení" },
  approved: { bg: "#e8f5e9", color: "#1b5e20", label: "Schváleno" },
  rejected: { bg: "#fce4ec", color: "#880e4f", label: "Zamítnuto" },
};

const TYPE_LABEL = {
  hotel: "🏨 Psí hotel",
  vencitel: "🦮 Venčitel",
  hlidani: "🏠 Hlídání",
  veterinar: "🩺 Veterinář",
};

export default function PartnerDashboard() {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [partnerProfile, setPartnerProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState([]);
  const [expandedRes, setExpandedRes] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/"); return; }
    fetchPartnerProfile();
  }, [user, authLoading]);

  const fetchPartnerProfile = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("partner_profiles")
      .select("*")
      .eq("user_id", user.id)
      .eq("approved", true)
      .in("type", ["hotel", "vencitel", "hlidani", "veterinar"])
      .single();

    if (!data) { navigate("/partneri"); return; }
    setPartnerProfile(data);
    fetchReservations(data.id);
    setLoading(false);
  };

  const fetchReservations = async (partnerId) => {
    const { data } = await supabase
      .from("reservations")
      .select("*")
      .eq("partner_id", partnerId)
      .order("created_at", { ascending: false });
    if (data) setReservations(data);
  };

  const handleAction = async (reservation, action) => {
    setActionLoading(reservation.id);
    const newStatus = action === "approve" ? "approved" : "rejected";

    const { error } = await supabase
      .from("reservations")
      .update({ status: newStatus })
      .eq("id", reservation.id);

    if (error) { setMsg("❌ Chyba: " + error.message); setActionLoading(null); return; }

    // Email zákazníkovi
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      await fetch(`${supabaseUrl}/functions/v1/send-order-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${supabaseKey}` },
        body: JSON.stringify({
          sellerEmail: reservation.customer_email,
          sellerName: reservation.customer_name,
          order: {
            _isReservationStatusUpdate: true,
            _status: newStatus,
            _partnerName: partnerProfile.name,
            _partnerPhone: partnerProfile.phone,
            _partnerAddress: `${partnerProfile.address || ""}, ${partnerProfile.city}`,
            _dateFrom: reservation.date_from,
            _dateTo: reservation.date_to,
            _numDogs: reservation.num_dogs,
            _totalPrice: reservation.total_price,
            buyer_name: reservation.customer_name,
            buyer_email: reservation.customer_email,
            buyer_phone: reservation.customer_phone || "",
            total_price: reservation.total_price,
            order_items: [],
            shipping_name: "",
            shipping_price: 0,
            buyer_address: "",
          },
        }),
      });
    } catch (e) { console.error("Email failed:", e); }

    setMsg(action === "approve" ? "✅ Rezervace schválena, zákazník byl informován." : "❌ Rezervace zamítnuta, zákazník byl informován.");
    setTimeout(() => setMsg(""), 4000);
    fetchReservations(partnerProfile.id);
    setActionLoading(null);
  };

  const handleSignOut = async () => { await signOut(); navigate("/"); };

  const pending = reservations.filter(r => r.status === "pending");
  const approved = reservations.filter(r => r.status === "approved");
  const rejected = reservations.filter(r => r.status === "rejected");

  const inputStyle = { fontFamily: "'DM Sans', sans-serif" };

  if (authLoading || loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif", background: "#f7f4ef" }}>
      <div style={{ textAlign: "center", color: "#8a9e92" }}>
        <div style={{ fontSize: "2rem", marginBottom: 12 }}>🐾</div>
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
        <span style={{ background: "#e8eef8", color: "#1a4fa0", border: "1px solid #b7c9e8", borderRadius: 20, padding: "3px 12px", fontSize: "0.78rem", fontWeight: 600 }}>
          {TYPE_LABEL[partnerProfile?.type] || "Partner"}
        </span>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: "0.85rem", color: "#4a5e52" }}>{partnerProfile?.name}</span>
          <button onClick={() => navigate(`/partner/${partnerProfile?.id}`)} style={{ background: "#f7f4ef", color: "#2d6a4f", border: "1.5px solid #b7d9c7", borderRadius: 8, padding: "7px 14px", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
            👁 Zobrazit profil
          </button>
          <button onClick={handleSignOut} style={{ background: "#fff", color: "#b91c1c", border: "1.5px solid #fecaca", borderRadius: 8, padding: "7px 14px", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Odhlásit</button>
        </div>
      </nav>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>

        {/* Statistiky */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 16, marginBottom: 28 }}>
          {[
            { label: "Celkem rezervací", value: reservations.length, icon: "📅", color: "#1a4fa0" },
            { label: "Čekají na schválení", value: pending.length, icon: "⏳", color: "#e65100" },
            { label: "Schváleno", value: approved.length, icon: "✅", color: "#1b5e20" },
            { label: "Tržby (schválené)", value: `${approved.reduce((s, r) => s + (r.total_price || 0), 0)} Kč`, icon: "💰", color: "#2d6a4f" },
          ].map(({ label, value, icon, color }) => (
            <div key={label} style={{ background: "#fff", borderRadius: 14, padding: "20px", border: "1px solid #ede8e0", textAlign: "center" }}>
              <div style={{ fontSize: "1.6rem", marginBottom: 8 }}>{icon}</div>
              <div style={{ fontSize: "1.4rem", fontWeight: 700, color, fontFamily: "'DM Serif Display', serif" }}>{value}</div>
              <div style={{ fontSize: "0.75rem", color: "#8a9e92", marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>

        {msg && (
          <div style={{ background: msg.includes("❌") ? "#fce4ec" : "#e8f5e9", border: `1px solid ${msg.includes("❌") ? "#f48fb1" : "#a5d6a7"}`, borderRadius: 12, padding: "14px 20px", marginBottom: 20, fontSize: "0.9rem", color: msg.includes("❌") ? "#880e4f" : "#1b5e20", fontWeight: 600 }}>
            {msg}
          </div>
        )}

        {/* Čekající rezervace */}
        {pending.length > 0 && (
          <div style={{ background: "#fff8e1", borderRadius: 16, padding: "24px 28px", border: "1px solid #f5c99a", marginBottom: 24 }}>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.2rem", color: "#1c2b22", marginBottom: 16 }}>
              ⏳ Čekají na schválení ({pending.length})
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {pending.map(r => (
                <ReservationCard
                  key={r.id}
                  reservation={r}
                  expanded={expandedRes === r.id}
                  onToggle={() => setExpandedRes(expandedRes === r.id ? null : r.id)}
                  onApprove={() => handleAction(r, "approve")}
                  onReject={() => handleAction(r, "reject")}
                  actionLoading={actionLoading === r.id}
                  showActions={true}
                />
              ))}
            </div>
          </div>
        )}

        {/* Všechny rezervace */}
        <div style={{ background: "#fff", borderRadius: 16, padding: "24px 28px", border: "1px solid #ede8e0" }}>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.2rem", color: "#1c2b22", marginBottom: 16 }}>
            📅 Všechny rezervace ({reservations.length})
          </h2>
          {reservations.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#8a9e92" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>📅</div>
              <p>Zatím žádné rezervace.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {reservations.map(r => (
                <ReservationCard
                  key={r.id}
                  reservation={r}
                  expanded={expandedRes === r.id}
                  onToggle={() => setExpandedRes(expandedRes === r.id ? null : r.id)}
                  onApprove={() => handleAction(r, "approve")}
                  onReject={() => handleAction(r, "reject")}
                  actionLoading={actionLoading === r.id}
                  showActions={r.status === "pending"}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ReservationCard({ reservation: r, expanded, onToggle, onApprove, onReject, actionLoading, showActions }) {
  const s = statusColor[r.status] || statusColor.pending;
  return (
    <div style={{ border: "1px solid #ede8e0", borderRadius: 12, overflow: "hidden", background: "#fff" }}>
      <div onClick={onToggle} style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", cursor: "pointer" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, color: "#1c2b22", marginBottom: 2 }}>{r.customer_name}</div>
          <div style={{ fontSize: "0.78rem", color: "#8a9e92" }}>
            {r.date_from} → {r.date_to} · {r.num_dogs} {r.num_dogs === 1 ? "pes" : "psů"} · {r.total_price} Kč
          </div>
        </div>
        <span style={{ background: s.bg, color: s.color, borderRadius: 20, padding: "4px 12px", fontSize: "0.72rem", fontWeight: 700 }}>{s.label}</span>
        <span style={{ color: "#8a9e92" }}>{expanded ? "▲" : "▼"}</span>
      </div>

      {expanded && (
        <div style={{ borderTop: "1px solid #ede8e0", padding: "16px 20px", background: "#fafaf8" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div style={{ fontSize: "0.85rem" }}>
              <div style={{ fontWeight: 600, color: "#1c2b22", marginBottom: 6 }}>👤 Zákazník</div>
              <div style={{ color: "#4a5e52" }}>{r.customer_name}</div>
              <div style={{ color: "#4a5e52" }}>📧 {r.customer_email}</div>
              <div style={{ color: "#4a5e52" }}>📞 {r.customer_phone || "—"}</div>
            </div>
            <div style={{ fontSize: "0.85rem" }}>
              <div style={{ fontWeight: 600, color: "#1c2b22", marginBottom: 6 }}>📅 Detaily</div>
              <div style={{ color: "#4a5e52" }}>Příjezd: {r.date_from}</div>
              <div style={{ color: "#4a5e52" }}>Odjezd: {r.date_to}</div>
              <div style={{ color: "#4a5e52" }}>Počet psů: {r.num_dogs}</div>
              <div style={{ color: "#1a4fa0", fontWeight: 700, marginTop: 4 }}>Celkem: {r.total_price} Kč</div>
            </div>
          </div>
          {r.notes && (
            <div style={{ background: "#f7f4ef", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: "0.85rem", color: "#4a5e52" }}>
              <strong>Poznámka:</strong> {r.notes}
            </div>
          )}
          <div style={{ fontSize: "0.72rem", color: "#8a9e92", marginBottom: showActions ? 12 : 0 }}>
            Přijato: {new Date(r.created_at).toLocaleDateString("cs-CZ", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
          </div>
          {showActions && (
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={onApprove}
                disabled={actionLoading}
                style={{ flex: 1, background: actionLoading ? "#b5cec0" : "#2d6a4f", color: "#fff", border: "none", borderRadius: 10, padding: "12px", fontSize: "0.9rem", fontWeight: 700, cursor: actionLoading ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                {actionLoading ? "Zpracovávám..." : "✓ Schválit rezervaci"}
              </button>
              <button
                onClick={onReject}
                disabled={actionLoading}
                style={{ flex: 1, background: "#fff", color: "#b91c1c", border: "1.5px solid #fecaca", borderRadius: 10, padding: "12px", fontSize: "0.9rem", fontWeight: 700, cursor: actionLoading ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                ✕ Zamítnout
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}