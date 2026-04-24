import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabase";
import { useAuth } from "./useAuth";
import AdminArticlesTab from "./AdminArticlesTab";

const ADMIN_EMAIL = "horejsi.jakub7799@gmail.com";

const TYPE_LABELS = {
  veterinar: "🩺 Veterinární klinika",
  hotel: "🏨 Psí hotel",
  vencitel: "🦮 Venčitel psů",
  prodejce: "🛍️ Partnerský prodejce",
  seller: "🏪 Prodejce",
  vycvik: "🎓 Výcvikové středisko",
};

// Pouze tyhle typy potřebují geolokaci (zobrazují se na mapách)
const GEOCODABLE_TYPES = ["hotel", "vencitel", "vycvik"];

// ===== Admin Tools Tab =====
function AdminToolsTab() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [geocoding, setGeocoding] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, done: [], failed: [] });
  const [log, setLog] = useState([]);

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    setLoading(true);
    const { data: partners } = await supabase
      .from("partner_profiles")
      .select("id, type, lat, lng, approved");
    const { data: vets } = await supabase
      .from("vet_profiles")
      .select("id, lat, lng, approved");

    const byType = {};

    // Jen hotely, venčitele a cvičáky (prodejce/seller ignorujeme)
    (partners || []).forEach(p => {
      if (!p.approved) return;
      if (!GEOCODABLE_TYPES.includes(p.type)) return;
      if (!byType[p.type]) byType[p.type] = { total: 0, missing: 0 };
      byType[p.type].total++;
      if (!p.lat || !p.lng) byType[p.type].missing++;
    });

    // Veterináři z vet_profiles
    const vetStats = { total: 0, missing: 0 };
    (vets || []).forEach(v => {
      if (!v.approved) return;
      vetStats.total++;
      if (!v.lat || !v.lng) vetStats.missing++;
    });
    if (vetStats.total > 0) byType.veterinar = vetStats;

    setStats(byType);
    setLoading(false);
  };

  const geocodeAddress = async (address, city) => {
    try {
      const query = encodeURIComponent(`${address}, ${city}, Czech Republic`);
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`);
      const data = await res.json();
      if (data && data.length > 0) {
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      }
    } catch (e) { console.error("Geocoding failed:", e); }
    return null;
  };

  const handleBatchGeocode = async () => {
    if (!confirm("Spustit batch geokódování? Operace může trvat několik minut.\n\nNominatim limit: 1 request/s, takže počítej cca 1s na partnera.")) return;

    setGeocoding(true);
    setLog([]);
    const logMsg = (msg) => setLog(prev => [...prev, `${new Date().toLocaleTimeString("cs-CZ")} — ${msg}`]);

    logMsg("🔍 Hledám partnery bez souřadnic...");

    // Jen hotely, venčitele a cvičáky - prodejce a sellery přeskakujeme
    const { data: partners } = await supabase
      .from("partner_profiles")
      .select("id, name, type, address, city, lat, lng")
      .eq("approved", true)
      .in("type", GEOCODABLE_TYPES)
      .or("lat.is.null,lng.is.null");

    // Veterináři
    const { data: vets } = await supabase
      .from("vet_profiles")
      .select("id, clinic_name, address, city, lat, lng")
      .eq("approved", true)
      .or("lat.is.null,lng.is.null");

    const allToGeocode = [
      ...(partners || []).map(p => ({ ...p, _table: "partner_profiles", _name: p.name, _label: TYPE_LABELS[p.type] || p.type })),
      ...(vets || []).map(v => ({ ...v, _table: "vet_profiles", _name: v.clinic_name, _label: "🩺 Veterinář" })),
    ];

    if (allToGeocode.length === 0) {
      logMsg("✅ Žádný partner nepotřebuje geokódování!");
      setGeocoding(false);
      return;
    }

    logMsg(`📍 Nalezeno ${allToGeocode.length} partnerů bez souřadnic`);
    setProgress({ current: 0, total: allToGeocode.length, done: [], failed: [] });

    const done = [];
    const failed = [];

    for (let i = 0; i < allToGeocode.length; i++) {
      const p = allToGeocode[i];
      setProgress({ current: i + 1, total: allToGeocode.length, done: [...done], failed: [...failed] });
      logMsg(`[${i + 1}/${allToGeocode.length}] ${p._label} — ${p._name} (${p.city})...`);

      // Nominatim rate limit: max 1 req/s
      if (i > 0) await new Promise(r => setTimeout(r, 1100));

      const coords = await geocodeAddress(p.address, p.city);

      if (coords) {
        const { error } = await supabase
          .from(p._table)
          .update({ lat: coords.lat, lng: coords.lng })
          .eq("id", p.id);

        if (error) {
          logMsg(`  ❌ DB chyba: ${error.message}`);
          failed.push(p._name);
        } else {
          logMsg(`  ✅ ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`);
          done.push(p._name);
        }
      } else {
        logMsg(`  ⚠️ Nepodařilo se najít souřadnice`);
        failed.push(p._name);
      }
    }

    setProgress({ current: allToGeocode.length, total: allToGeocode.length, done, failed });
    logMsg(`\n🎉 Hotovo! Úspěch: ${done.length}, Selhalo: ${failed.length}`);
    setGeocoding(false);
    fetchStats();
  };

  const totalMissing = stats ? Object.values(stats).reduce((sum, s) => sum + s.missing, 0) : 0;
  const totalAll = stats ? Object.values(stats).reduce((sum, s) => sum + s.total, 0) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: "24px 28px", border: "1px solid #ede8e0" }}>
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.3rem", color: "#1c2b22", marginBottom: 4 }}>🗺️ Geokódování partnerů</h2>
        <p style={{ color: "#8a9e92", fontSize: "0.88rem", marginBottom: 8 }}>
          Partneři bez souřadnic se nezobrazují na mapách. Použij batch geokódování pro jejich opravu.
        </p>
        <p style={{ color: "#8a9e92", fontSize: "0.78rem", marginBottom: 20, fontStyle: "italic" }}>
          Geokódují se pouze: hotely, venčitelé, cvičáci, veterináři. Prodejci a sellers souřadnice nepotřebují.
        </p>

        {loading ? (
          <div style={{ textAlign: "center", padding: "20px", color: "#8a9e92" }}>Načítám...</div>
        ) : (
          <>
            {Object.keys(stats).length === 0 ? (
              <div style={{ padding: "30px", textAlign: "center", color: "#8a9e92", background: "#f7f4ef", borderRadius: 12 }}>
                Žádní schválení partneři v kategoriích hotel/venčitel/cvičák/veterinář.
              </div>
            ) : (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10, marginBottom: 20 }}>
                  {Object.entries(stats).map(([type, s]) => (
                    <div key={type} style={{ background: s.missing > 0 ? "#fff8e1" : "#f2faf6", border: `1px solid ${s.missing > 0 ? "#ffecb3" : "#b7d9c7"}`, borderRadius: 12, padding: "14px" }}>
                      <div style={{ fontSize: "0.72rem", color: "#8a9e92", fontWeight: 600, textTransform: "uppercase", marginBottom: 6 }}>
                        {TYPE_LABELS[type] || type}
                      </div>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                        <span style={{ fontSize: "1.4rem", fontWeight: 700, color: s.missing > 0 ? "#e07b39" : "#2d6a4f", fontFamily: "'DM Serif Display', serif" }}>
                          {s.total - s.missing}
                        </span>
                        <span style={{ fontSize: "0.88rem", color: "#8a9e92" }}>/ {s.total}</span>
                      </div>
                      {s.missing > 0 && (
                        <div style={{ fontSize: "0.72rem", color: "#e07b39", marginTop: 4, fontWeight: 600 }}>
                          {s.missing} bez souřadnic
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px", background: totalMissing > 0 ? "#fff8e1" : "#f2faf6", borderRadius: 12, border: `1px solid ${totalMissing > 0 ? "#ffecb3" : "#b7d9c7"}` }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "#1c2b22" }}>
                      {totalMissing > 0
                        ? `${totalMissing} z ${totalAll} partnerů potřebuje geokódování`
                        : `Všichni partneři (${totalAll}) mají souřadnice ✅`}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#8a9e92", marginTop: 2 }}>
                      Použije Nominatim API (OpenStreetMap) · ~1s/partner
                    </div>
                  </div>
                  <button
                    onClick={handleBatchGeocode}
                    disabled={geocoding || totalMissing === 0}
                    style={{
                      background: geocoding || totalMissing === 0 ? "#b5cec0" : "#2d6a4f",
                      color: "#fff",
                      border: "none",
                      borderRadius: 10,
                      padding: "12px 22px",
                      fontSize: "0.9rem",
                      fontWeight: 600,
                      cursor: geocoding || totalMissing === 0 ? "not-allowed" : "pointer",
                      fontFamily: "'DM Sans', sans-serif",
                      whiteSpace: "nowrap"
                    }}
                  >
                    {geocoding ? "⏳ Probíhá..." : "🗺️ Spustit geokódování"}
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {geocoding && (
        <div style={{ background: "#fff", borderRadius: 16, padding: "20px 24px", border: "1px solid #ede8e0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: "0.85rem" }}>
            <span style={{ fontWeight: 600, color: "#1c2b22" }}>Progress</span>
            <span style={{ color: "#8a9e92" }}>{progress.current} / {progress.total}</span>
          </div>
          <div style={{ height: 8, background: "#f7f4ef", borderRadius: 8, overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%`,
              background: "linear-gradient(90deg, #2d6a4f, #3a7d60)",
              transition: "width 0.3s ease"
            }} />
          </div>
          <div style={{ display: "flex", gap: 16, marginTop: 10, fontSize: "0.78rem" }}>
            <span style={{ color: "#2d6a4f" }}>✅ Hotovo: {progress.done.length}</span>
            <span style={{ color: "#b91c1c" }}>❌ Selhalo: {progress.failed.length}</span>
          </div>
        </div>
      )}

      {log.length > 0 && (
        <div style={{ background: "#1c2b22", borderRadius: 16, padding: "20px 24px", color: "#b7d9c7", fontFamily: "monospace", fontSize: "0.78rem", lineHeight: 1.7, maxHeight: 340, overflowY: "auto" }}>
          {log.map((line, i) => <div key={i}>{line}</div>)}
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("cekajici");
  const [topTab, setTopTab] = useState("zadosti");
  const [vetProfiles, setVetProfiles] = useState([]);
  const [partnerProfiles, setPartnerProfiles] = useState([]);
  const [selected, setSelected] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [blacklist, setBlacklist] = useState([]);
  const [blacklistEmail, setBlacklistEmail] = useState("");
  const [blacklistReason, setBlacklistReason] = useState("");
  const [blacklistSaving, setBlacklistSaving] = useState(false);

  useEffect(() => {
    if (!loading && user?.email !== ADMIN_EMAIL) navigate("/");
  }, [user, loading]);

  useEffect(() => {
    if (user?.email === ADMIN_EMAIL) fetchAll();
  }, [user]);

  const fetchAll = async () => {
    const { data: vets } = await supabase.from("vet_profiles").select("*").order("created_at", { ascending: false });
    const { data: partners } = await supabase.from("partner_profiles").select("*, profiles(email)").order("created_at", { ascending: false });
    if (vets) setVetProfiles(vets);
    if (partners) setPartnerProfiles(partners);
    const { data: bl } = await supabase.from("blacklist").select("*").order("created_at", { ascending: false });
    if (bl) setBlacklist(bl);
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
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${supabaseKey}` },
        body: JSON.stringify({
          sellerEmail: email, sellerName: name,
          order: { buyer_name: "Pet Market Admin", buyer_email: ADMIN_EMAIL, buyer_phone: "", buyer_address: "", total_price: 0, shipping_name: "", shipping_price: 0, order_items: [], _isApproval: true, _approvalName: name, _approvalType: typeLabel },
        }),
      });
    } catch (err) { console.error("Approval email failed:", err); }
  };

  const handleApprove = async (profile) => {
    setSaving(true);
    const table = profile._type === "vet" ? "vet_profiles" : "partner_profiles";
    const { error } = await supabase.from(table).update({ approved: true }).eq("id", profile.id);
    if (error) { setMsg("❌ Chyba: " + error.message); setSaving(false); return; }
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

  const handleAddBlacklist = async () => {
    if (!blacklistEmail.trim()) return;
    setBlacklistSaving(true);
    const { error } = await supabase.from("blacklist").insert({ email: blacklistEmail.trim(), reason: blacklistReason });
    if (error) { setMsg("❌ Chyba: " + error.message); setBlacklistSaving(false); return; }
    setMsg("✅ Uživatel přidán na blacklist.");
    setBlacklistEmail(""); setBlacklistReason("");
    fetchAll();
    setBlacklistSaving(false);
    setTimeout(() => setMsg(""), 3000);
  };

  const handleRemoveBlacklist = async (id) => {
    if (!confirm("Odebrat z blacklistu?")) return;
    await supabase.from("blacklist").delete().eq("id", id);
    setMsg("✅ Odebráno z blacklistu.");
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
        <span style={{ background: profile.tier === "premium" ? "#fdf0e6" : "#e8f5ef", color: profile.tier === "premium" ? "#e07b39" : "#2d6a4f", borderRadius: 20, padding: "3px 10px", fontSize: "0.72rem", fontWeight: 700 }}>{profile.tier}</span>
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

      <div style={{ background: "#fff", borderBottom: "1px solid #ede8e0", padding: "0 32px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", gap: 0 }}>
          {[
            { id: "zadosti", label: "🔔 Žádosti partnerů" },
            { id: "clanky", label: "📝 Články (rady)" },
            { id: "nastroje", label: "⚙️ Nástroje" },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => { setTopTab(t.id); setSelected(null); }}
              style={{
                padding: "14px 20px",
                background: "none",
                border: "none",
                borderBottom: topTab === t.id ? "2px solid #2d6a4f" : "2px solid transparent",
                cursor: "pointer",
                fontSize: "0.9rem",
                fontWeight: topTab === t.id ? 700 : 500,
                color: topTab === t.id ? "#2d6a4f" : "#8a9e92",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>

        {topTab === "clanky" ? (
          <AdminArticlesTab />
        ) : topTab === "nastroje" ? (
          <AdminToolsTab />
        ) : (
          <div style={{ display: "flex", gap: 24 }}>
            <div style={{ width: 420, flexShrink: 0 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
                {[
                  { label: "Čekající", value: cekajici.length, color: "#e07b39" },
                  { label: "Schválení", value: schvaleni.length, color: "#2d6a4f" },
                  { label: "Celkem", value: allProfiles.length, color: "#1c2b22" },
                  { label: "Blacklist", value: blacklist.length, color: "#b91c1c" },
                ].map(s => (
                  <div key={s.label} style={{ background: "#fff", borderRadius: 12, padding: "14px", border: "1px solid #ede8e0", textAlign: "center" }}>
                    <div style={{ fontSize: "1.3rem", fontWeight: 700, color: s.color, fontFamily: "'DM Serif Display', serif" }}>{s.value}</div>
                    <div style={{ fontSize: "0.68rem", color: "#8a9e92", marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #ede8e0", overflow: "hidden" }}>
                <div style={{ display: "flex", borderBottom: "1px solid #ede8e0" }}>
                  {[
                    { id: "cekajici", label: `Čekající (${cekajici.length})` },
                    { id: "schvaleni", label: `Schválení (${schvaleni.length})` },
                    { id: "blacklist", label: `Blacklist (${blacklist.length})` },
                  ].map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, padding: "11px 6px", border: "none", background: tab === t.id ? "#e8f5ef" : "#fff", color: tab === t.id ? (t.id === "blacklist" ? "#b91c1c" : "#2d6a4f") : "#4a5e52", fontWeight: tab === t.id ? 600 : 400, fontSize: "0.78rem", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>{t.label}</button>
                  ))}
                </div>
                <div style={{ maxHeight: 520, overflowY: "auto" }}>
                  {tab === "blacklist" ? (
                    <div style={{ padding: "16px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                        <input value={blacklistEmail} onChange={e => setBlacklistEmail(e.target.value)} placeholder="Email uživatele" style={{ border: "1.5px solid #ede8e0", borderRadius: 8, padding: "9px 12px", fontSize: "0.85rem", outline: "none", fontFamily: "'DM Sans', sans-serif" }} />
                        <input value={blacklistReason} onChange={e => setBlacklistReason(e.target.value)} placeholder="Důvod (volitelné)" style={{ border: "1.5px solid #ede8e0", borderRadius: 8, padding: "9px 12px", fontSize: "0.85rem", outline: "none", fontFamily: "'DM Sans', sans-serif" }} />
                        <button onClick={handleAddBlacklist} disabled={blacklistSaving || !blacklistEmail} style={{ background: "#b91c1c", color: "#fff", border: "none", borderRadius: 8, padding: "9px", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>+ Přidat na blacklist</button>
                      </div>
                      {blacklist.length === 0 ? (
                        <div style={{ textAlign: "center", color: "#8a9e92", fontSize: "0.85rem", padding: "20px" }}>Blacklist je prázdný</div>
                      ) : blacklist.map(b => (
                        <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px", background: "#fce4ec", borderRadius: 10, marginBottom: 8 }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: "0.88rem", color: "#b91c1c" }}>{b.email}</div>
                            {b.reason && <div style={{ fontSize: "0.75rem", color: "#880e4f", marginTop: 2 }}>{b.reason}</div>}
                            <div style={{ fontSize: "0.7rem", color: "#c2607a", marginTop: 2 }}>{new Date(b.created_at).toLocaleDateString("cs-CZ")}</div>
                          </div>
                          <button onClick={() => handleRemoveBlacklist(b.id)} style={{ background: "#fff", color: "#b91c1c", border: "1px solid #fecaca", borderRadius: 6, padding: "5px 10px", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Odebrat</button>
                        </div>
                      ))}
                    </div>
                  ) : (tab === "cekajici" ? cekajici : schvaleni).length === 0 ? (
                    <div style={{ padding: "40px", textAlign: "center", color: "#8a9e92", fontSize: "0.85rem" }}>Žádné záznamy</div>
                  ) : (
                    (tab === "cekajici" ? cekajici : schvaleni).map(p => <ProfileCard key={p.id} profile={p} />)
                  )}
                </div>
              </div>
            </div>

            <div style={{ flex: 1 }}>
              {!selected || tab === "blacklist" ? (
                <div style={{ background: "#fff", borderRadius: 16, padding: "60px 32px", border: "1px solid #ede8e0", textAlign: "center", color: "#8a9e92" }}>
                  <div style={{ fontSize: "3rem", marginBottom: 16 }}>{tab === "blacklist" ? "🚫" : "👈"}</div>
                  <p>{tab === "blacklist" ? "Správa zakázaných uživatelů" : "Vyber žádost ze seznamu vlevo"}</p>
                </div>
              ) : (
                <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #ede8e0", overflow: "hidden" }}>
                  {selected.foto_urls && selected.foto_urls.length > 0 && (
                    <div style={{ display: "flex", gap: 8, padding: "16px", background: "#f7f4ef", overflowX: "auto" }}>
                      {selected.foto_urls.map((url, i) => <img key={i} src={url} style={{ width: 100, height: 80, objectFit: "cover", borderRadius: 8, flexShrink: 0 }} />)}
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
                        { label: "Email uživatele", value: selected.email || selected.profiles?.email },
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
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #ede8e0" }}>
                      <button onClick={() => { setBlacklistEmail(selected.email || selected.profiles?.email || ""); setTab("blacklist"); setSelected(null); }} style={{ background: "none", border: "none", color: "#b91c1c", fontSize: "0.78rem", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", textDecoration: "underline" }}>
                          🚫 Přidat uživatele na blacklist
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}