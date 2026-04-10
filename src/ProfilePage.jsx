import { useState } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "./supabase";

export default function ProfilePage({ onClose }) {
  const { user, profile, signOut, fetchProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: profile?.name || "",
    city: profile?.city || "",
    bio: profile?.bio || "",
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ name: form.name, city: form.city, bio: form.bio })
      .eq("id", user.id);
    setSaving(false);
    if (error) { setMsg("Chyba při ukládání."); return; }
    await fetchProfile(user.id);
    setMsg("✅ Uloženo!");
    setEditing(false);
    setTimeout(() => setMsg(""), 2000);
  };

  const roleLabel = {
    buyer: "🛒 Kupující",
    seller: "🏪 Prodejce",
    vet: "🩺 Veterinář / Salon",
  };

  return (
    <div
      style={{ position:"fixed", inset:0, background:"rgba(28,43,34,0.5)", backdropFilter:"blur(5px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:20 }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background:"#fff", borderRadius:20, padding:"36px 32px", width:"100%", maxWidth:480, position:"relative", boxShadow:"0 20px 60px rgba(0,0,0,0.15)" }}>

        <button onClick={onClose} style={{ position:"absolute", top:14, right:16, background:"none", border:"none", fontSize:24, color:"#9ca3af", cursor:"pointer" }}>×</button>

        {/* Avatar */}
        <div style={{ textAlign:"center", marginBottom:24 }}>
          <div style={{ width:80, height:80, borderRadius:"50%", background:"#2d6a4f", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"2rem", margin:"0 auto 12px" }}>
            🐾
          </div>
          <h2 style={{ fontFamily:"'DM Serif Display', serif", fontSize:"1.5rem", color:"#1c2b22", margin:"0 0 4px" }}>
            {profile?.name || user?.email?.split("@")[0] || "Uživatel"}
          </h2>
          <span style={{ background:"#e8f5ef", color:"#2d6a4f", border:"1px solid #b7d9c7", borderRadius:20, padding:"3px 12px", fontSize:"0.8rem", fontWeight:600 }}>
            {roleLabel[profile?.role] || "🐾 Uživatel"}
          </span>
        </div>

        {/* Info */}
        {!editing ? (
          <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:24 }}>
            <div style={{ background:"#f7f4ef", borderRadius:10, padding:"12px 16px" }}>
              <div style={{ fontSize:"0.72rem", fontWeight:600, color:"#8a9e92", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:4 }}>E-mail</div>
              <div style={{ color:"#1c2b22", fontSize:"0.95rem" }}>{user?.email}</div>
            </div>
            <div style={{ background:"#f7f4ef", borderRadius:10, padding:"12px 16px" }}>
              <div style={{ fontSize:"0.72rem", fontWeight:600, color:"#8a9e92", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:4 }}>Město</div>
              <div style={{ color:"#1c2b22", fontSize:"0.95rem" }}>{profile?.city || "—"}</div>
            </div>
            <div style={{ background:"#f7f4ef", borderRadius:10, padding:"12px 16px" }}>
              <div style={{ fontSize:"0.72rem", fontWeight:600, color:"#8a9e92", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:4 }}>O mně</div>
              <div style={{ color:"#1c2b22", fontSize:"0.95rem" }}>{profile?.bio || "—"}</div>
            </div>
            {msg && <div style={{ color:"#166534", fontSize:"0.85rem", textAlign:"center" }}>{msg}</div>}
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:24 }}>
            <div>
              <label style={{ fontSize:"0.72rem", fontWeight:600, color:"#8a9e92", textTransform:"uppercase", letterSpacing:"0.05em", display:"block", marginBottom:4 }}>Jméno</label>
              <input
                value={form.name}
                onChange={e => setForm(f => ({...f, name: e.target.value}))}
                style={{ width:"100%", border:"1.5px solid #ede8e0", borderRadius:10, padding:"10px 14px", fontSize:"0.95rem", outline:"none", fontFamily:"'DM Sans', sans-serif", background:"#f7f4ef" }}
              />
            </div>
            <div>
              <label style={{ fontSize:"0.72rem", fontWeight:600, color:"#8a9e92", textTransform:"uppercase", letterSpacing:"0.05em", display:"block", marginBottom:4 }}>Město</label>
              <input
                value={form.city}
                onChange={e => setForm(f => ({...f, city: e.target.value}))}
                placeholder="Praha"
                style={{ width:"100%", border:"1.5px solid #ede8e0", borderRadius:10, padding:"10px 14px", fontSize:"0.95rem", outline:"none", fontFamily:"'DM Sans', sans-serif", background:"#f7f4ef" }}
              />
            </div>
            <div>
              <label style={{ fontSize:"0.72rem", fontWeight:600, color:"#8a9e92", textTransform:"uppercase", letterSpacing:"0.05em", display:"block", marginBottom:4 }}>O mně</label>
              <textarea
                value={form.bio}
                onChange={e => setForm(f => ({...f, bio: e.target.value}))}
                placeholder="Něco o sobě..."
                style={{ width:"100%", border:"1.5px solid #ede8e0", borderRadius:10, padding:"10px 14px", fontSize:"0.95rem", outline:"none", fontFamily:"'DM Sans', sans-serif", minHeight:80, resize:"vertical", background:"#f7f4ef" }}
              />
            </div>
            {msg && <div style={{ color: msg.includes("Chyba") ? "#b91c1c" : "#166534", fontSize:"0.85rem" }}>{msg}</div>}
          </div>
        )}

        {/* Buttons */}
        <div style={{ display:"flex", gap:10 }}>
          {!editing ? (
            <>
              <button
                onClick={() => setEditing(true)}
                style={{ flex:1, background:"#2d6a4f", color:"#fff", border:"none", borderRadius:10, padding:"12px", fontSize:"0.9rem", fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans', sans-serif" }}
              >
                ✏️ Upravit profil
              </button>
              <button
                onClick={async () => { await signOut(); onClose(); }}
                style={{ background:"#fff", color:"#b91c1c", border:"1.5px solid #fecaca", borderRadius:10, padding:"12px 16px", fontSize:"0.9rem", fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans', sans-serif" }}
              >
                Odhlásit
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{ flex:1, background: saving ? "#b5cec0" : "#2d6a4f", color:"#fff", border:"none", borderRadius:10, padding:"12px", fontSize:"0.9rem", fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans', sans-serif" }}
              >
                {saving ? "Ukládám..." : "💾 Uložit"}
              </button>
              <button
                onClick={() => setEditing(false)}
                style={{ background:"#fff", color:"#6b7280", border:"1.5px solid #ede8e0", borderRadius:10, padding:"12px 16px", fontSize:"0.9rem", fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans', sans-serif" }}
              >
                Zrušit
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}