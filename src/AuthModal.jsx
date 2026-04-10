import { useState } from "react";
import { supabase } from "./supabase";
import "./AuthModal.css";

export default function AuthModal({ onClose, onAuthSuccess }) {
  const [mode, setMode] = useState("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({ email: "", password: "", passwordConfirm: "", name: "", role: "buyer" });
  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  const clearMessages = () => { setError(""); setSuccess(""); };

  const handleLogin = async (e) => {
    e.preventDefault(); clearMessages(); setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
    setLoading(false);
    if (error) return setError(getErrorMessage(error.message));
    onAuthSuccess?.(data.user); onClose?.();
  };

  const handleRegister = async (e) => {
    e.preventDefault(); clearMessages();
    if (!form.name.trim()) return setError("Zadej své jméno.");
    if (form.password.length < 6) return setError("Heslo musí mít alespoň 6 znaků.");
    if (form.password !== form.passwordConfirm) return setError("Hesla se neshodují.");
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email: form.email, password: form.password, options: { data: { name: form.name, role: form.role } } });
    setLoading(false);
    if (error) return setError(getErrorMessage(error.message));
    setSuccess("Zkontroluj e-mail a potvrď registraci. Pak se můžeš přihlásit.");
  };

  const handleReset = async (e) => {
    e.preventDefault(); clearMessages();
    if (!form.email) return setError("Zadej svůj e-mail.");
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(form.email, { redirectTo: window.location.origin });
    setLoading(false);
    if (error) return setError(getErrorMessage(error.message));
    setSuccess("Odkaz pro reset hesla byl odeslán na tvůj e-mail.");
  };

  const handleGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } });
    if (error) setError(getErrorMessage(error.message));
  };

  return (
    <div className="auth-overlay" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="auth-modal">
        <div className="auth-paw">🐾</div>
        <button className="auth-close" onClick={onClose}>×</button>
        <div className="auth-header">
          <h1 className="auth-logo">TLAPI</h1>
          <p className="auth-tagline">
            {mode === "login" && "Vítej zpět! Přihlas se ke svému účtu."}
            {mode === "register" && "Vytvoř si účet a začni prodávat nebo nakupovat."}
            {mode === "reset" && "Zapomněl jsi heslo? Pošleme ti odkaz."}
          </p>
        </div>
        {error && <div className="auth-alert auth-alert--error">{error}</div>}
        {success && <div className="auth-alert auth-alert--success">{success}</div>}
        {mode === "login" && (
          <form onSubmit={handleLogin} className="auth-form">
            <div className="auth-field"><label>E-mail</label><input type="email" placeholder="tvuj@email.cz" value={form.email} onChange={update("email")} required autoFocus /></div>
            <div className="auth-field"><label>Heslo</label><input type="password" placeholder="••••••••" value={form.password} onChange={update("password")} required /></div>
            <button type="button" className="auth-link auth-link--right" onClick={() => { setMode("reset"); clearMessages(); }}>Zapomněl/a jsi heslo?</button>
            <button type="submit" className="auth-btn" disabled={loading}>{loading ? <span className="auth-spinner" /> : "Přihlásit se"}</button>
          </form>
        )}
        {mode === "register" && (
          <form onSubmit={handleRegister} className="auth-form">
            <div className="auth-field"><label>Jméno a příjmení</label><input type="text" placeholder="Jan Novák" value={form.name} onChange={update("name")} required autoFocus /></div>
            <div className="auth-field"><label>E-mail</label><input type="email" placeholder="tvuj@email.cz" value={form.email} onChange={update("email")} required /></div>
            <div className="auth-field"><label>Heslo</label><input type="password" placeholder="Min. 6 znaků" value={form.password} onChange={update("password")} required /></div>
            <div className="auth-field"><label>Heslo znovu</label><input type="password" placeholder="Zopakuj heslo" value={form.passwordConfirm} onChange={update("passwordConfirm")} required /></div>
            <div className="auth-field">
              <label>Jsem</label>
              <div className="auth-roles">
                {[{value:"buyer",label:"🛒 Kupující",desc:"Nakupuji pro svého mazlíčka"},{value:"seller",label:"🏪 Prodejce",desc:"Prodávám zboží nebo mazlíčky"},{value:"vet",label:"🩺 Veterinář / Salon",desc:"Nabízím profesionální služby"}].map((r) => (
                  <button type="button" key={r.value} className={`auth-role-btn ${form.role === r.value ? "active" : ""}`} onClick={() => setForm((f) => ({ ...f, role: r.value }))}>
                    <span className="role-label">{r.label}</span><span className="role-desc">{r.desc}</span>
                  </button>
                ))}
              </div>
            </div>
            <button type="submit" className="auth-btn" disabled={loading}>{loading ? <span className="auth-spinner" /> : "Vytvořit účet"}</button>
          </form>
        )}
        {mode === "reset" && (
          <form onSubmit={handleReset} className="auth-form">
            <div className="auth-field"><label>Tvůj e-mail</label><input type="email" placeholder="tvuj@email.cz" value={form.email} onChange={update("email")} required autoFocus /></div>
            <button type="submit" className="auth-btn" disabled={loading}>{loading ? <span className="auth-spinner" /> : "Odeslat odkaz"}</button>
            <button type="button" className="auth-link auth-link--center" onClick={() => { setMode("login"); clearMessages(); }}>← Zpět na přihlášení</button>
          </form>
        )}
        {mode !== "reset" && (<>
          <div className="auth-divider"><span>nebo</span></div>
          <button className="auth-btn auth-btn--google" onClick={handleGoogle}>
            <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"/></svg>
            Pokračovat přes Google
          </button>
        </>)}
        <div className="auth-switch">
          {mode === "login" ? (<>Nemáš účet?{" "}<button className="auth-link" onClick={() => { setMode("register"); clearMessages(); }}>Zaregistruj se</button></>) 
          : mode === "register" ? (<>Už máš účet?{" "}<button className="auth-link" onClick={() => { setMode("login"); clearMessages(); }}>Přihlas se</button></>) : null}
        </div>
      </div>
    </div>
  );
}

function getErrorMessage(msg) {
  if (msg.includes("Invalid login credentials")) return "Nesprávný e-mail nebo heslo.";
  if (msg.includes("Email not confirmed")) return "Nejdříve potvrď svůj e-mail.";
  if (msg.includes("User already registered")) return "Tento e-mail je již registrován.";
  if (msg.includes("Password should be")) return "Heslo musí mít alespoň 6 znaků.";
  if (msg.includes("rate limit")) return "Příliš mnoho pokusů. Zkus to za chvíli.";
  return "Něco se pokazilo. Zkus to znovu.";
}
