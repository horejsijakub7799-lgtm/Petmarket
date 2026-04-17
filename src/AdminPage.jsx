import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabase";
import { useAuth } from "./useAuth";

const ADMIN_EMAIL = "horejsi.jakub7799@gmail.com";

const TYPE_LABELS = {
  veterinar: "🩺 Veterinární klinika",
  hotel: "🏨 Psí hotel",
  vencitel: "🦮 Venčitel psů",
  prodejce: "🛍️ Partnerský prodejce",
};

export default function AdminPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("cekajici");
  const [vetProfiles, setVetProfiles] = useState([]);
  const [partnerProfiles, setPartnerProfiles] = useState([]);
  const [selected, setSelected] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!loading && user?.email !== ADMIN_EMAIL) navigate("/");
  }, [user, loading]);

  useEffect(() => {
    if (user?.email === ADMIN_EMAIL) {
      fetchAll();
    }
  }, [user]);

  const fetchAll = async () => {
    const { data: vets } = await supabase.from("vet_profiles").select("*, profiles(email)").order("created_at", { ascending: false });
    const { data: partners } = await supabase.from("partner_profiles").select("*, profiles(email)").order("created_at", { ascending: false });
    if (vets) setVetProfiles(vets);
    if (partners) setPartnerProfiles(partners);
  };

  const allProfiles = [
    ...vetProfiles.map(p => ({ ...p, _type: "vet" })),
    ...partnerProfiles.map(p => ({ ...p, _type: "partner" })),
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const cekajici = allProfiles.filter(p => !p.approved);
  const schvaleni = allProfiles.filter(p => p.approved);

  const sendApprovalEmail = async (profile) => {
    try {
      const email = profile.profiles?.email || profile.email;
      const name = profile._type === "vet" ? profile.clinic_name : profile.name;
      const typeLabel = profile._type === "vet" ? "Veterinární klinika" : (TYPE_LABELS[profile.type] || profile.type);

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      await fetch(`${supabaseUrl}/functions/v1/send-order-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          sellerEmail: email,
          sellerName: name,
          order: {
            buyer_name: "Pet Market Admin",
            buyer_email: ADMIN_EMAIL,
            buyer_phone: "",
            buyer_address: "",
            total_price: 0,
            shipping_name: "",
            shipping_price: 0,
            order_items: [],
            _isApproval: true,
            _approvalName: name,
            _approvalType: typeLabel,
          },
        }),
      });
    } catch (err) {
      console.error("Approval email failed:", err);
    }
  };

  const handleApprove = async (profile) => {
    setSaving(true);
    const table = profile._type === "vet" ? "vet_profiles" : "partner_profiles";
    const { error } = await supabase.from(table).update({ approved: true }).eq("id", profile.id);
    if (error) { setMsg("❌ Chyba: " + error.message); setSaving(false); return; }

    // Pošli email o schválení
    await sendApprovalEmail(profile);

    setSaving(false);
    setMsg("✅ Schváleno! Email odeslán.");
    setSelected(null);
    fetchAll();
    setTimeout(() => setMsg(""), 3000);
  };

  const handleReject = async (profile) => {
    if (!confirm("Opravdu chceš zamítnout tuto žádost?")) return;
    setSaving(true);
    const table = profile._type === "vet" ? "vet_profiles" : "partner_profiles";
    const { error } = await supabase.from(table).delete().eq("id", profile.id);
    setSaving(false);
    if (error) { setMsg("❌ Chyba: " + error.message); return; }
    setMsg("🗑️ Zamítnuto a smazáno.");
    setSelected(null);
    fetchAll();
    setTimeout(() => setMsg(""), 3000);
  };

  if (loading) return null;
  if (user?.email !== ADMIN_EMAIL) return null;

  const ProfileCard = ({ profile }) => {
    const isVet = profile._type === "vet";
    const typeLabel = isVet ? "🩺 Veterinární klinika" : (TYPE_LABELS[profile.type] || profile.type);
    const name = isVet ? profile.clinic_name : profile.name;

    return (
      <div onClick={() => { setSelected(profile); setSelectedType(profile._type); }}
        style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", borderBottom: "1px solid #f7f4ef", cursor: "pointer", background: selected?.id === profile.id ? "#f2faf6" : "#fff" }}
        onMouseOver={e => e.currentTarget.style.background = "#f7f4ef"}
        onMouseOut={e => e.currentTarget.style.background = selected?.id === profile.id ? "#f2faf6" : "#fff"}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: "#e8f5ef", overflow: "hidden", flexShrink: 0 }}>
          {profile.foto_urls?.[0]
            ? <img src={profile.foto_urls[0]} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem" }}>{isVet ? "🩺" : "🐾"}</div>}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, color: "#1c2b22", marginBottom: 3 }}>{name}</div>
          <div style={{ fontSize: "0.78rem", color: "#8a9e92" }}>{typeLabel} · {profile.city} · {new Date(profile.created_at).toLocaleDateString("cs-CZ")}</div>
          <div style={{ fontSize: "0.72rem", color: "#8a9e92" }}>{profile.profiles?.email}</div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <span style={{ background: profile.tier === "premium" ? "#fdf0e6" : "#e8f5ef", color: profile.tier === "premium" ? "#e07b39" : "#2d6a4f", borderRadius: 20, padding: "3px 10px", fontSize: "0.72rem", fontWeight: 700 }}>{profile.tier}</span>
        </div>
      </div>
    );
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f7f4ef", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600;700&display=swap');`}</style>

      <nav style={{ background: "#2d6a4f", height: 64, display: "flex", alignItems: "center", padding: "0 32px", gap: 16 }}>
        <button onClick={() => navigate("/")} style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer" }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>🐾</div>
          <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.15rem", color: "#fff" }}>Pet Market</span>
        </button>
        <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.85rem" }}>/ Admin panel</span>
        {msg && <span style={{ marginLeft: "auto", background: "rgba(255,255,255,0.15)", color: "#fff", borderRadius: 20, padding: "5px 14px", fontSize: "0.82rem", fontWeight: 600 }}>{msg}</span>}
      </nav>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px", display: "flex", gap: 24 }}>

        <div style={{ width: 420, flexShrink: 0 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
            {[
              { label: "Čekající", value: cekajici.length, color: "#e07b39" },
              { label: "Schválení", value: schvaleni.length, color: "#2d6a4f" },
              { label: "Celkem", value: allProfiles.length, color: "#1c2b22" },
            ].map(s => (
              <div key={s.label} style={{ background: "#fff", borderRadius: 12, padding: "16px", border: "1px solid #ede8e0", textAlign: "center" }}>
                <div style={{ fontSize: "1.5rem", fontWeight: 700, color: s.color, fontFamily: "'DM Serif Display', serif" }}>{s.value}</div>
                <div style={{ fontSize: "0.72rem", color: "#8a9e92", marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #ede8e0", overflow: "hidden" }}>
            <div style={{ display: "flex", borderBottom: "1px solid #ede8e0" }}>
              {[
                { id: "cekajici", label: `Čekající (${cekajici.length})` },
                { id: "schvaleni", label: `Schválení (${schvaleni.length})` },
              ].map(t => (
                <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, padding: "13px", border: "none", background: tab === t.id ? "#e8f5ef" : "#fff", color: tab === t.id ? "#2d6a4f" : "#4a5e52", fontWeight: tab === t.id ? 600 : 400, fontSize: "0.85rem", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>{t.label}</button>
              ))}
            </div>
            <div style={{ maxHeight: 520, overflowY: "auto" }}>
              {(tab === "cekajici" ? cekajici : schvaleni).length === 0 ? (
                <div style={{ padding: "40px", textAlign: "center", color: "#8a9e92", fontSize: "0.85rem" }}>Žádné záznamy</div>
              ) : (
                (tab === "cekajici" ? cekajici : schvaleni).map(p => <ProfileCard key={p.id} profile={p} />)
              )}
            </div>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          {!selected ? (
            <div style={{ background: "#fff", borderRadius: 16, padding: "60px 32px", border: "1px solid #ede8e0", textAlign: "center", color: "#8a9e92" }}>
              <div style={{ fontSize: "3rem", marginBottom: 16 }}>👈</div>
              <p>Vyber žádost ze seznamu vlevo</p>
            </div>
          ) : (
            <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #ede8e0", overflow: "hidden" }}>
              {selected.foto_urls && selected.foto_urls.length > 0 && (
                <div style={{ display: "flex", gap: 8, padding: "16px", background: "#f7f4ef", overflowX: "auto" }}>
                  {selected.foto_urls.map((url, i) => (
                    <img key={i} src={url} style={{ width: 100, height: 80, objectFit: "cover", borderRadius: 8, flexShrink: 0 }} />
                  ))}
                </div>
              )}

              <div style={{ padding: "24px 28px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                  <div>
                    <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.4rem", color: "#1c2b22", marginBottom: 4 }}>
                      {selected._type === "vet" ? selected.clinic_name : selected.name}
                    </h2>
                    <div style={{ fontSize: "0.82rem", color: "#8a9e92" }}>
                      {selected._type === "vet" ? "🩺 Veterinární klinika" : TYPE_LABELS[selected.type]} · Registrováno {new Date(selected.created_at).toLocaleDateString("cs-CZ")}
                    </div>
                  </div>
                  <span style={{ background: selected.tier === "premium" ? "#fdf0e6" : "#e8f5ef", color: selected.tier === "premium" ? "#e07b39" : "#2d6a4f", borderRadius: 20, padding: "4px 14px", fontSize: "0.8rem", fontWeight: 700 }}>{selected.tier}</span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                  {[
                    { label: "Email uživatele", value: selected.profiles?.email },
                    { label: "IČO", value: selected.ico || "—" },
                    { label: "Adresa", value: `${selected.address}, ${selected.city}` },
                    { label: "Telefon", value: selected.phone },
                    { label: "Web", value: selected.web || "—" },
                    { label: "Plán", value: selected.tier },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ background: "#f7f4ef", borderRadius: 10, padding: "12px 14px" }}>
                      <div style={{ fontSize: "0.68rem", fontWeight: 600, color: "#8a9e92", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{label}</div>
                      <div style={{ fontSize: "0.88rem", color: "#1c2b22", fontWeight: 500 }}>{value}</div>
                    </div>
                  ))}
                </div>

                {selected._type === "vet" && selected.specializations?.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "#8a9e92", textTransform: "uppercase", marginBottom: 8 }}>Specializace</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {selected.specializations.map(s => <span key={s} style={{ background: "#e8f5ef", color: "#2d6a4f", borderRadius: 20, padding: "3px 10px", fontSize: "0.78rem", fontWeight: 600 }}>{s}</span>)}
                    </div>
                  </div>
                )}

                {selected.description && (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "#8a9e92", textTransform: "uppercase", marginBottom: 6 }}>Popis</div>
                    <p style={{ color: "#4a5e52", fontSize: "0.88rem", lineHeight: 1.6, margin: 0 }}>{selected.description}</p>
                  </div>
                )}

                {selected.ico && (
                  <div style={{ background: "#f2faf6", borderRadius: 10, padding: "12px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: "1.2rem" }}>🔍</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#2d6a4f" }}>Ověřit v ARES</div>
                      <div style={{ fontSize: "0.75rem", color: "#4a5e52" }}>IČO: {selected.ico}</div>
                    </div>
                    <a href={`https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/${selected.ico}`} target="_blank" rel="noopener noreferrer" style={{ background: "#2d6a4f", color: "#fff", borderRadius: 8, padding: "7px 14px", fontSize: "0.8rem", fontWeight: 600, textDecoration: "none" }}>Otevřít ARES →</a>
                  </div>
                )}

                {!selected.approved ? (
                  <div style={{ display: "flex", gap: 12 }}>
                    <button onClick={() => handleApprove(selected)} disabled={saving} style={{ flex: 1, background: saving ? "#b5cec0" : "#2d6a4f", color: "#fff", border: "none", borderRadius: 10, padding: "13px", fontSize: "0.95rem", fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif" }}>{saving ? "Ukládám..." : "✅ Schválit a poslat email"}</button>
                    <button onClick={() => handleReject(selected)} disabled={saving} style={{ background: "#fff", color: "#b91c1c", border: "1.5px solid #fecaca", borderRadius: 10, padding: "13px 20px", fontSize: "0.95rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>❌ Zamítnout</button>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: 12 }}>
                    <div style={{ flex: 1, background: "#e8f5ef", color: "#2d6a4f", borderRadius: 10, padding: "13px", textAlign: "center", fontSize: "0.9rem", fontWeight: 600 }}>✅ Profil je schválený a aktivní</div>
                    <button onClick={() => handleReject(selected)} disabled={saving} style={{ background: "#fff", color: "#b91c1c", border: "1.5px solid #fecaca", borderRadius: 10, padding: "13px 20px", fontSize: "0.95rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>🗑️ Smazat</button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}