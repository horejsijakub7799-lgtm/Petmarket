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

const MENU = [
  { id: "prehled", label: "Přehled", icon: "📊" },
  { id: "rezervace", label: "Rezervace", icon: "📅" },
  { id: "fotky", label: "Fotky", icon: "📷" },
  { id: "profil", label: "Můj profil", icon: "✏️" },
];

export default function PartnerDashboard() {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("prehled");
  const [partnerProfile, setPartnerProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState([]);
  const [expandedRes, setExpandedRes] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [msg, setMsg] = useState("");

  // Edit profilu
  const [editForm, setEditForm] = useState(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editMsg, setEditMsg] = useState("");

  // Fotky
  const [fotkyUploading, setFotkyUploading] = useState(false);
  const [fotkyMsg, setFotkyMsg] = useState("");

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
    setEditForm({
      name: data.name || "",
      phone: data.phone || "",
      address: data.address || "",
      city: data.city || "",
      website: data.website || "",
      description: data.description || "",
      email: data.email || "",
    });
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
    const { error } = await supabase.from("reservations").update({ status: newStatus }).eq("id", reservation.id);
    if (error) { setMsg("❌ Chyba: " + error.message); setActionLoading(null); return; }

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

    setMsg(action === "approve" ? "✅ Rezervace schválena, zákazník byl informován." : "✅ Rezervace zamítnuta, zákazník byl informován.");
    setTimeout(() => setMsg(""), 4000);
    fetchReservations(partnerProfile.id);
    setActionLoading(null);
  };

  const handleSaveProfile = async () => {
    setEditSaving(true); setEditMsg("");
    const { error } = await supabase
      .from("partner_profiles")
      .update({
        name: editForm.name,
        phone: editForm.phone,
        address: editForm.address,
        city: editForm.city,
        website: editForm.website,
        description: editForm.description,
        email: editForm.email,
      })
      .eq("id", partnerProfile.id);

    if (error) { setEditMsg("❌ Chyba: " + error.message); setEditSaving(false); return; }
    setEditMsg("✅ Profil uložen!");
    setPartnerProfile(p => ({ ...p, ...editForm }));
    setTimeout(() => setEditMsg(""), 3000);
    setEditSaving(false);
  };

  const compressImage = (file) => new Promise((resolve) => {
    const canvas = document.createElement("canvas"); const img = new Image();
    img.onload = () => {
      const maxSize = 1200; let w = img.width, h = img.height;
      if (w > h && w > maxSize) { h = (h * maxSize) / w; w = maxSize; } else if (h > maxSize) { w = (w * maxSize) / h; h = maxSize; }
      canvas.width = w; canvas.height = h; canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      canvas.toBlob((blob) => resolve(new File([blob], file.name, { type: "image/jpeg" })), "image/jpeg", 0.8);
    };
    img.src = URL.createObjectURL(file);
  });

  const handleFotkyUpload = async (e) => {
    const files = Array.from(e.target.files);
    const currentCount = partnerProfile?.foto_urls?.length || 0;
    if (currentCount + files.length > 8) { setFotkyMsg("⚠️ Max. 8 fotek celkem."); return; }
    setFotkyUploading(true); setFotkyMsg("");
    try {
      const newUrls = [];
      for (const file of files) {
        const compressed = await compressImage(file);
        const fileName = `partners/${partnerProfile.id}/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage.from("inzeraty").upload(fileName, compressed);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("inzeraty").getPublicUrl(fileName);
        newUrls.push(urlData.publicUrl);
      }
      const updatedUrls = [...(partnerProfile.foto_urls || []), ...newUrls];
      const { error } = await supabase.from("partner_profiles").update({ foto_urls: updatedUrls }).eq("id", partnerProfile.id);
      if (error) throw error;
      setPartnerProfile(p => ({ ...p, foto_urls: updatedUrls }));
      setFotkyMsg("✅ Fotky nahrány!");
      setTimeout(() => setFotkyMsg(""), 3000);
    } catch (err) { setFotkyMsg("❌ Chyba: " + err.message); }
    setFotkyUploading(false);
  };

  const handleFotkaDelete = async (url) => {
    const updatedUrls = (partnerProfile.foto_urls || []).filter(u => u !== url);
    const { error } = await supabase.from("partner_profiles").update({ foto_urls: updatedUrls }).eq("id", partnerProfile.id);
    if (error) { setFotkyMsg("❌ Chyba: " + error.message); return; }
    setPartnerProfile(p => ({ ...p, foto_urls: updatedUrls }));
  };

  const handleSetCoverPhoto = async (url) => {
    const otherUrls = (partnerProfile.foto_urls || []).filter(u => u !== url);
    const updatedUrls = [url, ...otherUrls];
    const { error } = await supabase.from("partner_profiles").update({ foto_urls: updatedUrls, cover_photo: url }).eq("id", partnerProfile.id);
    if (error) { setFotkyMsg("❌ Chyba: " + error.message); return; }
    setPartnerProfile(p => ({ ...p, foto_urls: updatedUrls, cover_photo: url }));
    setFotkyMsg("✅ Titulní fotka nastavena!");
    setTimeout(() => setFotkyMsg(""), 3000);
  };

  const handleSignOut = async () => { await signOut(); navigate("/"); };

  const pending = reservations.filter(r => r.status === "pending");
  const approved = reservations.filter(r => r.status === "approved");

  const inputStyle = { width: "100%", border: "1.5px solid #ede8e0", borderRadius: 10, padding: "10px 14px", fontSize: "0.9rem", outline: "none", fontFamily: "'DM Sans', sans-serif", background: "#f7f4ef", boxSizing: "border-box", color: "#1c2b22" };
  const labelStyle = { fontSize: "0.72rem", fontWeight: 600, color: "#8a9e92", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 };

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

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px", display: "flex", gap: 24 }}>

        {/* Sidebar */}
        <div style={{ width: 220, flexShrink: 0 }}>
          <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden", border: "1px solid #ede8e0" }}>
            {MENU.map((item, i) => (
              <button key={item.id} onClick={() => setActiveTab(item.id)} style={{ width: "100%", padding: "13px 18px", display: "flex", alignItems: "center", gap: 10, background: activeTab === item.id ? "#e8f5ef" : "#fff", border: "none", borderBottom: i < MENU.length - 1 ? "1px solid #f7f4ef" : "none", cursor: "pointer", fontSize: "0.88rem", fontWeight: activeTab === item.id ? 600 : 400, color: activeTab === item.id ? "#2d6a4f" : "#4a5e52", fontFamily: "'DM Sans', sans-serif", textAlign: "left" }}>
                <span>{item.icon}</span>
                {item.label}
                {item.id === "rezervace" && pending.length > 0 && (
                  <span style={{ marginLeft: "auto", background: "#e07b39", color: "#fff", borderRadius: "50%", width: 18, height: 18, fontSize: "0.65rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {pending.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Obsah */}
        <div style={{ flex: 1 }}>

          {/* PŘEHLED */}
          {activeTab === "prehled" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 16 }}>
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

              {pending.length > 0 && (
                <div style={{ background: "#fff8e1", borderRadius: 16, padding: "20px 24px", border: "1px solid #f5c99a" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.1rem", color: "#1c2b22", margin: 0 }}>⏳ Čekají na schválení ({pending.length})</h2>
                    <button onClick={() => setActiveTab("rezervace")} style={{ background: "#e07b39", color: "#fff", border: "none", borderRadius: 8, padding: "6px 14px", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Zobrazit vše →</button>
                  </div>
                  {pending.slice(0, 3).map(r => (
                    <div key={r.id} style={{ background: "#fff", borderRadius: 10, padding: "12px 16px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "#1c2b22" }}>{r.customer_name}</div>
                        <div style={{ fontSize: "0.78rem", color: "#8a9e92" }}>{r.date_from} → {r.date_to} · {r.num_dogs} psů · {r.total_price} Kč</div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => handleAction(r, "approve")} disabled={actionLoading === r.id} style={{ background: "#2d6a4f", color: "#fff", border: "none", borderRadius: 8, padding: "7px 14px", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>✓ Schválit</button>
                        <button onClick={() => handleAction(r, "reject")} disabled={actionLoading === r.id} style={{ background: "#fff", color: "#b91c1c", border: "1.5px solid #fecaca", borderRadius: 8, padding: "7px 12px", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>✕ Zamítnout</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ background: "#fff", borderRadius: 16, padding: "20px 24px", border: "1px solid #ede8e0" }}>
                <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.1rem", color: "#1c2b22", marginBottom: 14 }}>Posledních 5 rezervací</h2>
                {reservations.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "24px", color: "#8a9e92", fontSize: "0.88rem" }}>Zatím žádné rezervace.</div>
                ) : reservations.slice(0, 5).map(r => {
                  const s = statusColor[r.status] || statusColor.pending;
                  return (
                    <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid #f7f4ef" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: "0.88rem", color: "#1c2b22" }}>{r.customer_name}</div>
                        <div style={{ fontSize: "0.75rem", color: "#8a9e92" }}>{r.date_from} → {r.date_to}</div>
                      </div>
                      <div style={{ fontWeight: 700, color: "#2d6a4f", fontSize: "0.88rem" }}>{r.total_price} Kč</div>
                      <span style={{ background: s.bg, color: s.color, borderRadius: 20, padding: "3px 10px", fontSize: "0.68rem", fontWeight: 700 }}>{s.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* REZERVACE */}
          {activeTab === "rezervace" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {msg && (
                <div style={{ background: msg.includes("❌") ? "#fce4ec" : "#e8f5e9", border: `1px solid ${msg.includes("❌") ? "#f48fb1" : "#a5d6a7"}`, borderRadius: 12, padding: "14px 20px", fontSize: "0.9rem", color: msg.includes("❌") ? "#880e4f" : "#1b5e20", fontWeight: 600 }}>
                  {msg}
                </div>
              )}

              {/* Filtry */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                {[
                  { key: "vse", label: "Všechny", count: reservations.length },
                  { key: "pending", label: "Čekají", count: pending.length },
                  { key: "approved", label: "Schválené", count: approved.length },
                  { key: "rejected", label: "Zamítnuté", count: reservations.filter(r => r.status === "rejected").length },
                ].map(f => (
                  <div key={f.key} style={{ background: "#fff", borderRadius: 12, padding: "14px", border: "1px solid #ede8e0", textAlign: "center" }}>
                    <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "#1c2b22" }}>{f.count}</div>
                    <div style={{ fontSize: "0.75rem", color: "#8a9e92", marginTop: 2 }}>{f.label}</div>
                  </div>
                ))}
              </div>

              {pending.length > 0 && (
                <div style={{ background: "#fff8e1", borderRadius: 16, padding: "24px 28px", border: "1px solid #f5c99a" }}>
                  <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.2rem", color: "#1c2b22", marginBottom: 16 }}>⏳ Čekají na schválení ({pending.length})</h2>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {pending.map(r => (
                      <ReservationCard key={r.id} reservation={r} expanded={expandedRes === r.id} onToggle={() => setExpandedRes(expandedRes === r.id ? null : r.id)} onApprove={() => handleAction(r, "approve")} onReject={() => handleAction(r, "reject")} actionLoading={actionLoading === r.id} showActions={true} />
                    ))}
                  </div>
                </div>
              )}

              <div style={{ background: "#fff", borderRadius: 16, padding: "24px 28px", border: "1px solid #ede8e0" }}>
                <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.2rem", color: "#1c2b22", marginBottom: 16 }}>📅 Všechny rezervace ({reservations.length})</h2>
                {reservations.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px", color: "#8a9e92" }}>
                    <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>📅</div>
                    <p>Zatím žádné rezervace.</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {reservations.map(r => (
                      <ReservationCard key={r.id} reservation={r} expanded={expandedRes === r.id} onToggle={() => setExpandedRes(expandedRes === r.id ? null : r.id)} onApprove={() => handleAction(r, "approve")} onReject={() => handleAction(r, "reject")} actionLoading={actionLoading === r.id} showActions={r.status === "pending"} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* FOTKY */}
          {activeTab === "fotky" && (
            <div style={{ background: "#fff", borderRadius: 16, padding: "28px 32px", border: "1px solid #ede8e0" }}>
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.4rem", color: "#1c2b22", marginBottom: 8 }}>📷 Fotky profilu</h2>
              <p style={{ color: "#8a9e92", fontSize: "0.88rem", marginBottom: 24 }}>Nahrajte fotky vašeho hotelu/místa. Max. 8 fotek. První fotka je titulní.</p>

              {fotkyMsg && (
                <div style={{ background: fotkyMsg.includes("❌") || fotkyMsg.includes("⚠️") ? "#fce4ec" : "#e8f5e9", border: `1px solid ${fotkyMsg.includes("❌") || fotkyMsg.includes("⚠️") ? "#f48fb1" : "#a5d6a7"}`, borderRadius: 10, padding: "12px 16px", fontSize: "0.88rem", color: fotkyMsg.includes("❌") || fotkyMsg.includes("⚠️") ? "#880e4f" : "#1b5e20", fontWeight: 600, marginBottom: 16 }}>
                  {fotkyMsg}
                </div>
              )}

              {/* Grid fotek */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12, marginBottom: 20 }}>
                {(partnerProfile?.foto_urls || []).map((url, i) => (
                  <div key={url} style={{ position: "relative", aspectRatio: "1", borderRadius: 12, overflow: "hidden", border: i === 0 ? "3px solid #2d6a4f" : "1.5px solid #ede8e0" }}>
                    <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    {i === 0 && (
                      <div style={{ position: "absolute", top: 6, left: 6, background: "#2d6a4f", color: "#fff", borderRadius: 20, padding: "2px 8px", fontSize: "0.65rem", fontWeight: 700 }}>TITULNÍ</div>
                    )}
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(0,0,0,0.5)", display: "flex", gap: 4, padding: "6px" }}>
                      {i !== 0 && (
                        <button onClick={() => handleSetCoverPhoto(url)} style={{ flex: 1, background: "#2d6a4f", color: "#fff", border: "none", borderRadius: 6, padding: "4px", fontSize: "0.65rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>★ Titulní</button>
                      )}
                      <button onClick={() => handleFotkaDelete(url)} style={{ flex: 1, background: "#b91c1c", color: "#fff", border: "none", borderRadius: 6, padding: "4px", fontSize: "0.65rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>🗑 Smazat</button>
                    </div>
                  </div>
                ))}

                {(partnerProfile?.foto_urls?.length || 0) < 8 && (
                  <label style={{ aspectRatio: "1", borderRadius: 12, border: "2px dashed #b7d9c7", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: fotkyUploading ? "not-allowed" : "pointer", color: "#8a9e92", fontSize: "0.82rem", background: "#f7f4ef", gap: 8 }}>
                    <span style={{ fontSize: "2rem" }}>{fotkyUploading ? "⏳" : "📷"}</span>
                    {fotkyUploading ? "Nahrávám..." : "Přidat fotku"}
                    <input type="file" accept="image/*" multiple onChange={handleFotkyUpload} style={{ display: "none" }} disabled={fotkyUploading} />
                  </label>
                )}
              </div>

              <div style={{ background: "#f0f7f4", borderRadius: 10, padding: "12px 16px", fontSize: "0.82rem", color: "#2d6a4f" }}>
                💡 Tip: Klikněte na "★ Titulní" pro nastavení hlavní fotky která se zobrazí zákazníkům jako první.
              </div>
            </div>
          )}

          {/* PROFIL */}
          {activeTab === "profil" && editForm && (
            <div style={{ background: "#fff", borderRadius: 16, padding: "28px 32px", border: "1px solid #ede8e0" }}>
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.4rem", color: "#1c2b22", marginBottom: 24 }}>✏️ Upravit profil</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

                <div><label style={labelStyle}>Název / Jméno *</label><input style={inputStyle} value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} placeholder="Psí hotel U Palečka" /></div>

                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14 }}>
                  <div><label style={labelStyle}>Ulice a číslo</label><input style={inputStyle} value={editForm.address} onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))} placeholder="Václavské náměstí 1" /></div>
                  <div><label style={labelStyle}>Město</label><input style={inputStyle} value={editForm.city} onChange={e => setEditForm(f => ({ ...f, city: e.target.value }))} placeholder="Praha" /></div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div><label style={labelStyle}>Telefon</label><input style={inputStyle} value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} placeholder="+420 777 123 456" /></div>
                  <div><label style={labelStyle}>Web</label><input style={inputStyle} value={editForm.website} onChange={e => setEditForm(f => ({ ...f, website: e.target.value }))} placeholder="www.vas-hotel.cz" /></div>
                </div>

                <div style={{ background: "#f0f7f4", borderRadius: 12, padding: "16px 18px", border: "1px solid #b7d9c7" }}>
                  <label style={{ ...labelStyle, color: "#2d6a4f" }}>🔔 Notifikační email</label>
                  <input type="email" style={inputStyle} value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} placeholder="hotel@email.cz" />
                  <div style={{ fontSize: "0.72rem", color: "#4a5e52", marginTop: 6 }}>Na tento email vám budou chodit upozornění o nových rezervacích s odkazem na schválení.</div>
                </div>

                <div><label style={labelStyle}>Popis</label><textarea style={{ ...inputStyle, minHeight: 120, resize: "vertical" }} value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} placeholder="Popište vaše služby..." /></div>

                {editMsg && (
                  <div style={{ background: editMsg.includes("❌") ? "#fce4ec" : "#e8f5e9", border: `1px solid ${editMsg.includes("❌") ? "#f48fb1" : "#a5d6a7"}`, borderRadius: 10, padding: "12px 16px", fontSize: "0.88rem", color: editMsg.includes("❌") ? "#880e4f" : "#1b5e20", fontWeight: 600 }}>
                    {editMsg}
                  </div>
                )}

                <div style={{ display: "flex", gap: 12 }}>
                  <button onClick={handleSaveProfile} disabled={editSaving} style={{ flex: 1, background: editSaving ? "#b5cec0" : "#2d6a4f", color: "#fff", border: "none", borderRadius: 10, padding: "13px", fontSize: "0.95rem", fontWeight: 600, cursor: editSaving ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                    {editSaving ? "Ukládám..." : "✓ Uložit změny"}
                  </button>
                  <button onClick={() => navigate(`/partner/${partnerProfile?.id}`)} style={{ background: "#f7f4ef", color: "#2d6a4f", border: "1.5px solid #b7d9c7", borderRadius: 10, padding: "13px 20px", fontSize: "0.95rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                    👁 Zobrazit profil
                  </button>
                </div>

                <div style={{ background: "#f7f4ef", borderRadius: 12, padding: "16px 18px", border: "1px solid #ede8e0" }}>
                  <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#8a9e92", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Informace o účtu</div>
                  <div style={{ fontSize: "0.85rem", color: "#4a5e52" }}>
                    <div style={{ marginBottom: 4 }}><strong>Typ:</strong> {TYPE_LABEL[partnerProfile?.type]}</div>
                    <div style={{ marginBottom: 4 }}><strong>Plán:</strong> {partnerProfile?.tier === "premium" ? "⭐ Premium" : "✓ Basic"}</div>
                    <div><strong>ID profilu:</strong> {partnerProfile?.id?.slice(0, 8)}...</div>
                  </div>
                </div>
              </div>
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
              <button onClick={onApprove} disabled={actionLoading} style={{ flex: 1, background: actionLoading ? "#b5cec0" : "#2d6a4f", color: "#fff", border: "none", borderRadius: 10, padding: "12px", fontSize: "0.9rem", fontWeight: 700, cursor: actionLoading ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                {actionLoading ? "Zpracovávám..." : "✓ Schválit rezervaci"}
              </button>
              <button onClick={onReject} disabled={actionLoading} style={{ flex: 1, background: "#fff", color: "#b91c1c", border: "1.5px solid #fecaca", borderRadius: 10, padding: "12px", fontSize: "0.9rem", fontWeight: 700, cursor: actionLoading ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                ✕ Zamítnout
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}