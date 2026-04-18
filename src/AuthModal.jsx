import { useState } from "react";
import { supabase } from "./supabase";

export default function AuthModal({ onClose, onAuthSuccess }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("user");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const clearMessages = () => { setError(null); setSuccess(null); };

  const handleLogin = async () => {
    if (!email || !password) { setError("Vyplň e-mail a heslo."); return; }
    setLoading(true); clearMessages();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError("Špatný e-mail nebo heslo."); setLoading(false); return; }

    const userId = data.user?.id;
    if (userId) {
      // Zkontroluj partner_profiles (hotel/venčitel)
      const { data: partnerProfile } = await supabase
        .from("partner_profiles")
        .select("id, type")
        .eq("user_id", userId)
        .eq("approved", true)
        .in("type", ["hotel", "vencitel"])
        .maybeSingle();

      if (partnerProfile) {
        onClose();
        window.location.href = "/partner/dashboard";
        return;
      }

      // Zkontroluj vet_profiles (veterináři)
      const { data: vetProfile } = await supabase
        .from("vet_profiles")
        .select("id")
        .eq("user_id", userId)
        .eq("approved", true)
        .maybeSingle();

      if (vetProfile) {
        onClose();
        window.location.href = "/partner/dashboard";
        return;
      }

      // Zkontroluj seller
      const { data: sellerProfile } = await supabase
        .from("partner_profiles")
        .select("id")
        .eq("user_id", userId)
        .eq("type", "seller")
        .eq("approved", true)
        .maybeSingle();

      if (sellerProfile) {
        onClose();
        window.location.href = "/seller/dashboard";
        return;
      }
    }

    setLoading(false);
    onAuthSuccess?.();
    onClose();
  };

  const handleRegister = async () => {
    if (!name || !email || !password) { setError("Vyplň všechna pole."); return; }
    if (password.length < 6) { setError("Heslo musí mít alespoň 6 znaků."); return; }
    setLoading(true); clearMessages();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name, role: role === "vet" ? "vet" : "buyer" } },
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setSuccess("✅ Účet vytvořen! Zkontroluj e-mail pro potvrzení.");
  };

  const handleReset = async () => {
    if (!email) { setError("Zadej svůj e-mail."); return; }
    setLoading(true); clearMessages();
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setSuccess("📬 Odkaz pro reset hesla byl odeslán na tvůj e-mail.");
  };

  const handleGoogle = async () => {
    setLoading(true); clearMessages();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) { setError(error.message); setLoading(false); }
  };

  const handleSubmit = () => {
    if (mode === "login") handleLogin();
    else if (mode === "register") handleRegister();
    else handleReset();
  };

  const titles = { login: "Přihlásit se", register: "Vytvořit účet", reset: "Reset hesla" };

  const inputStyle = {
    width: "100%", border: "1.5px solid #ede8e0", borderRadius: 10,
    padding: "11px 14px", fontSize: "0.9rem", outline: "none",
    background: "#f7f4ef", color: "#1c2b22",
    fontFamily: "'DM Sans', sans-serif", transition: "border-color 0.18s",
    boxSizing: "border-box",
  };

  const labelStyle = {
    fontSize: "0.75rem", fontWeight: 600, color: "#4a5e52",
    textTransform: "uppercase", letterSpacing: "0.06em",
    display: "block", marginBottom: 6,
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(28,43,34,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300, padding: 20, backdropFilter: "blur(6px)" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 22, width: "100%", maxWidth: 420, boxShadow: "0 12px 40px rgba(44,80,58,0.18)", overflow: "hidden" }}>

        <div style={{ padding: "22px 24px 18px", borderBottom: "1px solid #ede8e0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: "#2d6a4f", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>🐾</div>
            <div>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.15rem", color: "#1c2b22" }}>{titles[mode]}</div>
              <div style={{ fontSize: "0.7rem", color: "#8a9e92", letterSpacing: "0.08em", textTransform: "uppercase" }}>Pet Market</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "#f7f4ef", border: "none", borderRadius: "50%", width: 36, height: 36, cursor: "pointer", fontSize: "1rem", color: "#4a5e52", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>

        <div style={{ padding: "24px 24px 28px", display: "flex", flexDirection: "column", gap: 14 }}>

          {mode !== "reset" && (
            <button onClick={handleGoogle} disabled={loading} style={{ width: "100%", padding: "11px 16px", border: "1.5px solid #ede8e0", borderRadius: 10, background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, fontSize: "0.9rem", fontWeight: 600, color: "#1c2b22", fontFamily: "'DM Sans', sans-serif" }}
              onMouseOver={e => e.currentTarget.style.background = "#f7f4ef"}
              onMouseOut={e => e.currentTarget.style.background = "#fff"}
            >
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
                <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"/>
              </svg>
              Pokračovat přes Google
            </button>
          )}

          {mode !== "reset" && (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1, height: 1, background: "#ede8e0" }} />
              <span style={{ fontSize: "0.75rem", color: "#8a9e92", fontWeight: 500 }}>nebo e-mailem</span>
              <div style={{ flex: 1, height: 1, background: "#ede8e0" }} />
            </div>
          )}

          {mode === "register" && (
            <div>
              <label style={labelStyle}>Typ účtu</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <button onClick={() => setRole("user")} style={{ padding: "12px 10px", borderRadius: 12, cursor: "pointer", border: role === "user" ? "2px solid #2d6a4f" : "1.5px solid #ede8e0", background: role === "user" ? "#e8f5ef" : "#fff", textAlign: "center", fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s" }}>
                  <div style={{ fontSize: "1.4rem", marginBottom: 4 }}>🐾</div>
                  <div style={{ fontSize: "0.82rem", fontWeight: 700, color: role === "user" ? "#2d6a4f" : "#1c2b22" }}>Uživatel</div>
                  <div style={{ fontSize: "0.7rem", color: "#8a9e92", marginTop: 2 }}>Nakupuji & prodávám</div>
                </button>
                <button onClick={() => setRole("vet")} style={{ padding: "12px 10px", borderRadius: 12, cursor: "pointer", border: role === "vet" ? "2px solid #2d6a4f" : "1.5px solid #ede8e0", background: role === "vet" ? "#e8f5ef" : "#fff", textAlign: "center", fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s" }}>
                  <div style={{ fontSize: "1.4rem", marginBottom: 4 }}>🩺</div>
                  <div style={{ fontSize: "0.82rem", fontWeight: 700, color: role === "vet" ? "#2d6a4f" : "#1c2b22" }}>Veterinář / Salon</div>
                  <div style={{ fontSize: "0.7rem", color: "#8a9e92", marginTop: 2 }}>Profesionální účet</div>
                </button>
              </div>
            </div>
          )}

          {mode === "register" && (
            <div>
              <label style={labelStyle}>Celé jméno</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Jana Nováková" onKeyDown={e => e.key === "Enter" && handleSubmit()} style={inputStyle}
                onFocus={e => e.target.style.borderColor = "#2d6a4f"}
                onBlur={e => e.target.style.borderColor = "#ede8e0"}
              />
            </div>
          )}

          <div>
            <label style={labelStyle}>E-mail</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jana@email.cz" onKeyDown={e => e.key === "Enter" && handleSubmit()} style={inputStyle}
              onFocus={e => e.target.style.borderColor = "#2d6a4f"}
              onBlur={e => e.target.style.borderColor = "#ede8e0"}
            />
          </div>

          {mode !== "reset" && (
            <div>
              <label style={labelStyle}>Heslo</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={mode === "register" ? "Min. 6 znaků" : "••••••••"} onKeyDown={e => e.key === "Enter" && handleSubmit()} style={inputStyle}
                onFocus={e => e.target.style.borderColor = "#2d6a4f"}
                onBlur={e => e.target.style.borderColor = "#ede8e0"}
              />
            </div>
          )}

          {error && <div style={{ background: "#fce4ec", border: "1px solid #f48fb1", borderRadius: 10, padding: "10px 14px", fontSize: "0.85rem", color: "#880e4f" }}>⚠️ {error}</div>}
          {success && <div style={{ background: "#e8f5e9", border: "1px solid #a5d6a7", borderRadius: 10, padding: "10px 14px", fontSize: "0.85rem", color: "#1b5e20" }}>{success}</div>}

          <button onClick={handleSubmit} disabled={loading} style={{ width: "100%", padding: "13px", background: loading ? "#b5cec0" : "#2d6a4f", color: "#fff", border: "none", borderRadius: 10, fontSize: "0.95rem", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif", boxShadow: "0 2px 12px rgba(45,106,79,0.25)" }}>
            {loading ? "Moment…" : titles[mode]}
          </button>

          <div style={{ textAlign: "center", fontSize: "0.85rem", color: "#4a5e52", display: "flex", flexDirection: "column", gap: 8 }}>
            {mode === "login" && (
              <>
                <span>Nemáš účet?{" "}
                  <button onClick={() => { setMode("register"); clearMessages(); }} style={{ background: "none", border: "none", color: "#2d6a4f", fontWeight: 700, cursor: "pointer", fontSize: "0.85rem", fontFamily: "'DM Sans', sans-serif" }}>Zaregistruj se</button>
                </span>
                <button onClick={() => { setMode("reset"); clearMessages(); }} style={{ background: "none", border: "none", color: "#8a9e92", cursor: "pointer", fontSize: "0.8rem", fontFamily: "'DM Sans', sans-serif" }}>Zapomněl/a jsem heslo</button>
              </>
            )}
            {mode === "register" && (
              <span>Už máš účet?{" "}
                <button onClick={() => { setMode("login"); clearMessages(); }} style={{ background: "none", border: "none", color: "#2d6a4f", fontWeight: 700, cursor: "pointer", fontSize: "0.85rem", fontFamily: "'DM Sans', sans-serif" }}>Přihlásit se</button>
              </span>
            )}
            {mode === "reset" && (
              <button onClick={() => { setMode("login"); clearMessages(); }} style={{ background: "none", border: "none", color: "#2d6a4f", fontWeight: 700, cursor: "pointer", fontSize: "0.85rem", fontFamily: "'DM Sans', sans-serif" }}>← Zpět na přihlášení</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}