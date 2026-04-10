import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./useAuth";
import { supabase } from "./supabase";

const BUYER_MENU = [
  { id: "profil", label: "Profil", icon: "👤" },
  { id: "nakupy", label: "Historie nákupů", icon: "🛒" },
  { id: "zpravy", label: "Zprávy", icon: "💬" },
  { id: "heslo", label: "Změna hesla", icon: "🔒" },
];

const SELLER_MENU = [
  { id: "profil", label: "Profil", icon: "👤" },
  { id: "inzeraty", label: "Moje inzeráty", icon: "📋" },
  { id: "pridat", label: "Přidat inzerát", icon: "➕" },
  { id: "prijmy", label: "Příjmy & statistiky", icon: "📊" },
  { id: "hodnoceni", label: "Hodnocení", icon: "⭐" },
  { id: "zpravy", label: "Zprávy", icon: "💬" },
  { id: "heslo", label: "Změna hesla", icon: "🔒" },
];

const MONTHS = ["Led", "Úno", "Bře", "Dub", "Kvě", "Čer", "Čec", "Srp", "Zář", "Říj", "Lis", "Pro"];

function MiniBarChart({ data }) {
  const max = Math.max(...data, 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 80, marginTop: 8 }}>
      {data.map((val, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <div style={{
            width: "100%", background: val > 0 ? "#2d6a4f" : "#e8f5ef",
            borderRadius: "4px 4px 0 0",
            height: `${Math.max((val / max) * 64, val > 0 ? 4 : 0)}px`,
          }} />
          <span style={{ fontSize: "0.6rem", color: "#8a9e92" }}>{MONTHS[i]}</span>
        </div>
      ))}
    </div>
  );
}

export default function ProfilePage() {
  const { user, profile, signOut, fetchProfile } = useAuth();
  const navigate = useNavigate();

  const role = profile?.role || "buyer";
  const isSeller = role === "seller";
  const MENU = SELLER_MENU;

  const [activeTab, setActiveTab] = useState("profil");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: profile?.name || "",
    city: profile?.city || "",
    bio: profile?.bio || "",
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [passwords, setPasswords] = useState({ new: "", confirm: "" });
  const [pwMsg, setPwMsg] = useState("");

  const mockInzeraty = [
    { id: 1, title: "Pelíšek M/L", price: 340, status: "aktivní", views: 45, emoji: "🛏️" },
    { id: 2, title: "Vodítko kožené", price: 115, status: "aktivní", views: 23, emoji: "🔗" },
    { id: 3, title: "Zimní bundička", price: 145, status: "prodáno", views: 89, emoji: "🧥" },
  ];
  const mockPrijmy = [0, 0, 145, 0, 340, 115, 0, 0, 0, 0, 0, 0];
  const mockHodnoceni = [
    { id: 1, from: "Jana K.", rating: 5, text: "Rychlé jednání, zboží přesně jak popsáno!", date: "15. 3. 2026" },
    { id: 2, from: "Tomáš M.", rating: 4, text: "Spokojený, doporučuji.", date: "2. 4. 2026" },
  ];

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ name: form.name, city: form.city, bio: form.bio }).eq("id", user.id);
    setSaving(false);
    if (error) { setMsg("Chyba při ukládání."); return; }
    await fetchProfile(user.id);
    setMsg("✅ Uloženo!");
    setEditing(false);
    setTimeout(() => setMsg(""), 3000);
  };

  const handlePasswordChange = async () => {
    if (passwords.new !== passwords.confirm) { setPwMsg("Hesla se neshodují."); return; }
    if (passwords.new.length < 6) { setPwMsg("Heslo musí mít alespoň 6 znaků."); return; }
    const { error } = await supabase.auth.updateUser({ password: passwords.new });
    if (error) { setPwMsg("Chyba: " + error.message); return; }
    setPwMsg("✅ Heslo změněno!");
    setPasswords({ new: "", confirm: "" });
    setTimeout(() => setPwMsg(""), 3000);
  };

  const handleSignOut = async () => { await signOut(); navigate("/"); };

  const roleLabel = { buyer: "🛒 Kupující", seller: "🏪 Prodejce", vet: "🩺 Veterinář" };

  if (!user) { navigate("/"); return null; }

  const inputStyle = {
    width: "100%", border: "1.5px solid #ede8e0", borderRadius: 10,
    padding: "10px 14px", fontSize: "0.95rem", outline: "none",
    fontFamily: "'DM Sans', sans-serif", background: "#f7f4ef", boxSizing: "border-box"
  };

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600;700&display=swap');`}</style>

      <nav style={{ background: "#fff", borderBottom: "1px solid #ede8e0", height: 64, display: "flex", alignItems: "center", padding: "0 32px", gap: 16, position: "sticky", top: 0, zIndex: 100, boxShadow: "0 1px 12px rgba(44,80,58,0.07)" }}>
        <button onClick={() => navigate("/")} style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer" }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: "#2d6a4f", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>🐾</div>
          <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.15rem", color: "#1c2b22" }}>Pet Market</span>
        </button>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: "0.85rem", color: "#4a5e52" }}>{user?.email}</span>
          <button onClick={handleSignOut} style={{ background: "#fff", color: "#b91c1c", border: "1.5px solid #fecaca", borderRadius: 8, padding: "7px 14px", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Odhlásit</button>
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px", display: "flex", gap: 28 }}>

        <div style={{ width: 260, flexShrink: 0 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: "24px 20px", marginBottom: 12, border: "1px solid #ede8e0", textAlign: "center" }}>
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#2d6a4f", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.8rem", margin: "0 auto 12px" }}>🐾</div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.15rem", color: "#1c2b22", marginBottom: 6 }}>{profile?.name || user?.email?.split("@")[0]}</div>
            <span style={{ background: "#e8f5ef", color: "#2d6a4f", border: "1px solid #b7d9c7", borderRadius: 20, padding: "3px 12px", fontSize: "0.78rem", fontWeight: 600 }}>
              {roleLabel[role] || "🐾 Uživatel"}
            </span>
            {isSeller && (
              <div style={{ marginTop: 12, display: "flex", justifyContent: "center", gap: 16 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#2d6a4f" }}>{mockInzeraty.length}</div>
                  <div style={{ fontSize: "0.7rem", color: "#8a9e92" }}>inzerátů</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#2d6a4f" }}>⭐ 4.8</div>
                  <div style={{ fontSize: "0.7rem", color: "#8a9e92" }}>hodnocení</div>
                </div>
              </div>
            )}
          </div>

          <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden", border: "1px solid #ede8e0" }}>
            {MENU.map((item, i) => (
              <button key={item.id} onClick={() => setActiveTab(item.id)} style={{
                width: "100%", padding: "13px 20px", display: "flex", alignItems: "center", gap: 12,
                background: activeTab === item.id ? "#e8f5ef" : "#fff", border: "none",
                borderBottom: i < MENU.length - 1 ? "1px solid #f7f4ef" : "none",
                cursor: "pointer", fontSize: "0.88rem", fontWeight: activeTab === item.id ? 600 : 400,
                color: activeTab === item.id ? "#2d6a4f" : "#4a5e52",
                fontFamily: "'DM Sans', sans-serif", textAlign: "left",
              }}>
                <span>{item.icon}</span>{item.label}
                {activeTab === item.id && <span style={{ marginLeft: "auto", color: "#2d6a4f" }}>›</span>}
              </button>
            ))}
            <button onClick={handleSignOut} style={{ width: "100%", padding: "13px 20px", display: "flex", alignItems: "center", gap: 12, background: "#fff", border: "none", borderTop: "1px solid #f7f4ef", cursor: "pointer", fontSize: "0.88rem", color: "#b91c1c", fontFamily: "'DM Sans', sans-serif", textAlign: "left" }}>
              <span>🚪</span> Odhlásit se
            </button>
          </div>
        </div>

        <div style={{ flex: 1 }}>

          {activeTab === "profil" && (
            <div style={{ background: "#fff", borderRadius: 16, padding: "28px 32px", border: "1px solid #ede8e0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.4rem", color: "#1c2b22", margin: 0 }}>Můj profil</h2>
                {!editing && <button onClick={() => setEditing(true)} style={{ background: "#2d6a4f", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>✏️ Upravit</button>}
              </div>
              {!editing ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {[{ label: "Celé jméno", value: profile?.name || "—" }, { label: "E-mail", value: user?.email }, { label: "Město", value: profile?.city || "—" }, { label: "O mně", value: profile?.bio || "—" }, { label: "Role", value: roleLabel[role] }].map(({ label, value }) => (
                    <div key={label} style={{ borderBottom: "1px solid #f7f4ef", paddingBottom: 16 }}>
                      <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "#8a9e92", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{label}</div>
                      <div style={{ color: "#1c2b22", fontSize: "0.95rem" }}>{value}</div>
                    </div>
                  ))}
                  {msg && <div style={{ color: "#166534", fontSize: "0.85rem" }}>{msg}</div>}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {[{ label: "Celé jméno", key: "name", placeholder: "Jana Nováková" }, { label: "Město", key: "city", placeholder: "Praha" }].map(({ label, key, placeholder }) => (
                    <div key={key}>
                      <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#8a9e92", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>{label}</label>
                      <input value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder} style={inputStyle} />
                    </div>
                  ))}
                  <div>
                    <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#8a9e92", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>O mně</label>
                    <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} placeholder="Něco o sobě..." style={{ ...inputStyle, minHeight: 100, resize: "vertical" }} />
                  </div>
                  {msg && <div style={{ color: msg.includes("Chyba") ? "#b91c1c" : "#166534", fontSize: "0.85rem" }}>{msg}</div>}
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={handleSave} disabled={saving} style={{ flex: 1, background: saving ? "#b5cec0" : "#2d6a4f", color: "#fff", border: "none", borderRadius: 10, padding: "12px", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>{saving ? "Ukládám..." : "💾 Uložit změny"}</button>
                    <button onClick={() => setEditing(false)} style={{ background: "#fff", color: "#6b7280", border: "1.5px solid #ede8e0", borderRadius: 10, padding: "12px 20px", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Zrušit</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "nakupy" && (
            <div style={{ background: "#fff", borderRadius: 16, padding: "28px 32px", border: "1px solid #ede8e0" }}>
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.4rem", color: "#1c2b22", marginBottom: 24 }}>Historie nákupů</h2>
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#8a9e92" }}>
                <div style={{ fontSize: "3rem", marginBottom: 16 }}>🛒</div>
                <p>Zatím žádné nákupy.</p>
                <button onClick={() => navigate("/")} style={{ marginTop: 16, background: "#2d6a4f", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Procházet inzeráty</button>
              </div>
            </div>
          )}

          {activeTab === "inzeraty" && (
            <div style={{ background: "#fff", borderRadius: 16, padding: "28px 32px", border: "1px solid #ede8e0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.4rem", color: "#1c2b22", margin: 0 }}>Moje inzeráty</h2>
                <button onClick={() => setActiveTab("pridat")} style={{ background: "#2d6a4f", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>+ Přidat</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {mockInzeraty.map(item => (
                  <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px", border: "1px solid #ede8e0", borderRadius: 12 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 10, background: "#e8f5ef", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", flexShrink: 0 }}>{item.emoji}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: "#1c2b22", marginBottom: 4 }}>{item.title}</div>
                      <div style={{ fontSize: "0.8rem", color: "#8a9e92" }}>👁️ {item.views} zobrazení</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 700, color: "#2d6a4f", fontSize: "1.1rem" }}>{item.price} Kč</div>
                      <span style={{ fontSize: "0.72rem", fontWeight: 600, padding: "2px 10px", borderRadius: 20, background: item.status === "aktivní" ? "#e8f5ef" : "#f3f4f6", color: item.status === "aktivní" ? "#2d6a4f" : "#6b7280" }}>{item.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "pridat" && (
            <div style={{ background: "#fff", borderRadius: 16, padding: "28px 32px", border: "1px solid #ede8e0" }}>
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.4rem", color: "#1c2b22", marginBottom: 24 }}>Přidat inzerát</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 500 }}>
                {[{ label: "Název inzerátu", placeholder: "Pelíšek pro psa, vel. M" }, { label: "Cena (Kč)", placeholder: "350" }, { label: "Město", placeholder: "Praha" }].map(({ label, placeholder }) => (
                  <div key={label}>
                    <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#8a9e92", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>{label}</label>
                    <input placeholder={placeholder} style={inputStyle} />
                  </div>
                ))}
                <div>
                  <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#8a9e92", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>Popis</label>
                  <textarea placeholder="Stav, rozměry, důvod prodeje..." style={{ ...inputStyle, minHeight: 100, resize: "vertical" }} />
                </div>
                <button style={{ background: "#2d6a4f", color: "#fff", border: "none", borderRadius: 10, padding: "13px", fontSize: "0.95rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>✓ Zveřejnit inzerát</button>
              </div>
            </div>
          )}

          {activeTab === "prijmy" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                {[{ label: "Celkové příjmy", value: "600 Kč", icon: "💰" }, { label: "Prodané položky", value: "1", icon: "📦" }, { label: "Aktivní inzeráty", value: "2", icon: "📋" }].map(({ label, value, icon }) => (
                  <div key={label} style={{ background: "#fff", borderRadius: 14, padding: "20px", border: "1px solid #ede8e0", textAlign: "center" }}>
                    <div style={{ fontSize: "1.8rem", marginBottom: 8 }}>{icon}</div>
                    <div style={{ fontSize: "1.3rem", fontWeight: 700, color: "#2d6a4f", fontFamily: "'DM Serif Display', serif" }}>{value}</div>
                    <div style={{ fontSize: "0.78rem", color: "#8a9e92", marginTop: 4 }}>{label}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: "#fff", borderRadius: 16, padding: "28px 32px", border: "1px solid #ede8e0" }}>
                <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.3rem", color: "#1c2b22", marginBottom: 4 }}>Příjmy podle měsíce</h2>
                <div style={{ fontSize: "0.85rem", color: "#8a9e92", marginBottom: 16 }}>Rok 2026</div>
                <MiniBarChart data={mockPrijmy} />
              </div>
            </div>
          )}

          {activeTab === "hodnoceni" && (
            <div style={{ background: "#fff", borderRadius: 16, padding: "28px 32px", border: "1px solid #ede8e0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
                <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.4rem", color: "#1c2b22", margin: 0 }}>Hodnocení</h2>
                <div style={{ background: "#e8f5ef", color: "#2d6a4f", borderRadius: 20, padding: "4px 14px", fontSize: "0.9rem", fontWeight: 700 }}>⭐ 4.8 / 5</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {mockHodnoceni.map(h => (
                  <div key={h.id} style={{ padding: "16px", border: "1px solid #ede8e0", borderRadius: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <div style={{ fontWeight: 600, color: "#1c2b22" }}>{h.from}</div>
                      <div style={{ fontSize: "0.8rem", color: "#8a9e92" }}>{h.date}</div>
                    </div>
                    <div style={{ marginBottom: 8 }}>{"⭐".repeat(h.rating)}</div>
                    <div style={{ color: "#4a5e52", fontSize: "0.9rem" }}>{h.text}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "zpravy" && (
            <div style={{ background: "#fff", borderRadius: 16, padding: "28px 32px", border: "1px solid #ede8e0" }}>
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.4rem", color: "#1c2b22", marginBottom: 24 }}>Zprávy</h2>
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#8a9e92" }}>
                <div style={{ fontSize: "3rem", marginBottom: 16 }}>💬</div>
                <p>Zatím žádné zprávy.</p>
              </div>
            </div>
          )}

          {activeTab === "heslo" && (
            <div style={{ background: "#fff", borderRadius: 16, padding: "28px 32px", border: "1px solid #ede8e0" }}>
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.4rem", color: "#1c2b22", marginBottom: 24 }}>Změna hesla</h2>
              <div style={{ maxWidth: 400, display: "flex", flexDirection: "column", gap: 16 }}>
                {[{ label: "Nové heslo", key: "new", placeholder: "Min. 6 znaků" }, { label: "Potvrdit heslo", key: "confirm", placeholder: "Zopakuj heslo" }].map(({ label, key, placeholder }) => (
                  <div key={key}>
                    <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#8a9e92", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>{label}</label>
                    <input type="password" value={passwords[key]} onChange={e => setPasswords(p => ({ ...p, [key]: e.target.value }))} placeholder={placeholder} style={inputStyle} />
                  </div>
                ))}
                {pwMsg && <div style={{ color: pwMsg.includes("✅") ? "#166534" : "#b91c1c", fontSize: "0.85rem" }}>{pwMsg}</div>}
                <button onClick={handlePasswordChange} style={{ background: "#2d6a4f", color: "#fff", border: "none", borderRadius: 10, padding: "12px", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>🔒 Změnit heslo</button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}