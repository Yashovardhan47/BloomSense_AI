import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { ArrowRight, Eye, EyeOff, Flower2, Leaf, LockKeyhole, Mail, Sparkles, UserRound } from "lucide-react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import { DEMO_MODE } from "../../services/auth/authService";

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState(() => searchParams.get("mode") === "register" ? "register" : "login");
  const [visible, setVisible] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { user, login, register, googleLogin, enterDemo } = useAuth();
  const navigate = useNavigate();
  const googleConfigured = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

  if (user) return <Navigate to="/home" replace />;

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true); setError("");
    try {
      if (mode === "register") await register(form.name, form.email, form.password);
      else await login(form.email, form.password);
      navigate("/home");
    } catch (caught) {
      setError(caught.message);
    } finally { setBusy(false); }
  };

  const googleSuccess = async ({ credential }) => {
    setBusy(true); setError("");
    try { await googleLogin(credential); navigate("/home"); }
    catch (caught) { setError(caught.message); }
    finally { setBusy(false); }
  };

  const demo = async () => { await enterDemo(); navigate("/home"); };

  return (
    <section className="auth-page container">
      <div className="auth-story">
        <span className="eyebrow"><Sparkles size={15} /> Your private garden command centre</span>
        <h1>Sign in, then care<br /><span>with confidence.</span></h1>
        <p>Your personal home brings today’s garden priorities, monitored plants, recent discoveries, health signals, and progress into one clear view.</p>
        <div className="auth-points">
          <span><Leaf /> Private discovery history</span>
          <span><LockKeyhole /> Secure rotating JWT sessions</span>
          <span><Flower2 /> Trusted botanical sources</span>
        </div>
      </div>
      <div className="auth-card">
        <div className="auth-tabs">
          <button className={mode === "login" ? "active" : ""} onClick={() => { setMode("login"); setError(""); }}>Sign in</button>
          <button className={mode === "register" ? "active" : ""} onClick={() => { setMode("register"); setError(""); }}>Create account</button>
        </div>
        <div className="auth-title"><h2>{mode === "login" ? "Welcome back" : "Join BloomSense"}</h2><p>{mode === "login" ? "Continue your botanical journey." : "Start a private garden of discoveries."}</p></div>

        {DEMO_MODE ? (
          <button className="google-placeholder google-demo" onClick={() => googleSuccess({ credential: "demo-google-credential" })}>
            <span aria-hidden="true">G</span> Continue with Google · interactive demo
          </button>
        ) : googleConfigured ? (
          <div className="google-wrap"><GoogleLogin onSuccess={googleSuccess} onError={() => setError("Google sign-in was cancelled or failed")} shape="pill" size="large" width="320" /></div>
        ) : (
          <button className="google-placeholder" disabled>Google sign-in · add client ID to enable</button>
        )}
        <div className="divider"><span>or use email</span></div>

        <form onSubmit={submit}>
          {mode === "register" && <label><span>Full name</span><div className="input-shell"><UserRound /><input required minLength="2" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Yashovardhan" /></div></label>}
          <label><span>Email address</span><div className="input-shell"><Mail /><input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" /></div></label>
          <label><span>Password</span><div className="input-shell"><LockKeyhole /><input required minLength="8" type={visible ? "text" : "password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="At least 8 characters" /><button type="button" onClick={() => setVisible((value) => !value)} aria-label="Show password">{visible ? <EyeOff /> : <Eye />}</button></div></label>
          {error && <div className="form-error">{error}</div>}
          <button className="button primary full" disabled={busy}>{busy ? <span className="spinner" /> : <>{mode === "login" ? "Sign in securely" : "Create my account"}<ArrowRight size={18} /></>}</button>
        </form>
        {DEMO_MODE && <button className="demo-entry" onClick={demo}>Explore the complete demo without an account <ArrowRight size={15} /></button>}
        <p className="auth-note">By continuing, you agree to use recognition as educational guidance—not medical, safety, or foraging advice.</p>
      </div>
    </section>
  );
}
