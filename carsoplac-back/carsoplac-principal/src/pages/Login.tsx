// src/pages/Login.tsx
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";
import { API_URL } from "../config/api";

// Mismo mínimo que exige el backend (auth/dto/login.dto.ts → @MinLength(6))
const MIN_PASSWORD = 6;

// El free tier de Render "duerme" el servicio tras inactividad; el primer
// request puede tardar ~60s en despertarlo. Damos margen antes de abortar.
const REQUEST_TIMEOUT_MS = 90_000;

type LoginStatus = "idle" | "submitting" | "success" | "error";

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<LoginStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    // Validación client-side (espeja las reglas del backend para feedback inmediato)
    if (!username.trim()) {
      setStatus("error");
      setErrorMsg("Ingresá tu usuario.");
      return;
    }
    if (password.length < MIN_PASSWORD) {
      setStatus("error");
      setErrorMsg(`La contraseña debe tener al menos ${MIN_PASSWORD} caracteres.`);
      return;
    }

    setStatus("submitting");

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // credentials: el backend setea la cookie JWT como httpOnly;
        // sin esto el navegador la descarta en pedidos cross-origin.
        credentials: "include",
        signal: controller.signal,
        body: JSON.stringify({ username: username.trim(), password }),
      });
      window.clearTimeout(timeout);

      if (res.status === 401) {
        setStatus("error");
        setErrorMsg("Usuario o contraseña incorrectos.");
        return;
      }
      if (!res.ok) {
        setStatus("error");
        setErrorMsg(`Error del servidor (${res.status}). Reintentá en unos momentos.`);
        return;
      }

      // Login OK: feedback breve y redirección a la home
      setStatus("success");
      window.setTimeout(() => navigate("/", { replace: true }), 900);
    } catch (err) {
      window.clearTimeout(timeout);
      setStatus("error");
      setErrorMsg(
        err instanceof DOMException && err.name === "AbortError"
          ? "El servidor está despertando y tardó demasiado. Reintentá en unos segundos."
          : "No pudimos conectar con el servidor. Verificá tu conexión y reintentá."
      );
    }
  };

  const inputWrap = "relative";
  const inputIcon =
    "absolute left-4 top-1/2 -translate-y-1/2 text-sage-gray pointer-events-none";

  return (
    <section className="min-h-[calc(100vh-var(--navbar-h))] bg-midnight-forest flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="bg-deep-lichen border border-spruce-border text-white rounded-xl p-8 ">
          <span className="eyebrow">Acceso</span>
          <h1 className="h1 mt-1 text-white">Iniciar sesión</h1>
          <p className="text-sm text-sage-gray mt-2">
            Ingresá con tu cuenta para gestionar el sitio.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4" noValidate>
            {/* Usuario */}
            <div>
              <label
                htmlFor="username"
                className="block text-xs font-bold uppercase tracking-wider text-sage-gray mb-1.5"
              >
                Usuario
              </label>
              <div className={inputWrap}>
                <User size={16} className={inputIcon} />
                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Tu usuario"
                  className="input-base pl-11"
                  aria-invalid={status === "error"}
                />
              </div>
            </div>

            {/* Contraseña */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-bold uppercase tracking-wider text-sage-gray mb-1.5"
              >
                Contraseña
              </label>
              <div className={inputWrap}>
                <Lock size={16} className={inputIcon} />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-base pl-11 pr-12"
                  aria-invalid={status === "error"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 grid place-items-center rounded-full text-sage-gray hover:bg-white/10 hover:text-white transition cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Feedback */}
            {errorMsg && (
              <div
                role="alert"
                className="flex items-start gap-2 text-sm font-medium text-[rgb(var(--color-danger-text))]"
              >
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                {errorMsg}
              </div>
            )}
            {status === "success" && (
              <div className="flex items-center gap-2 text-sm font-semibold text-[rgb(var(--color-success-text))]">
                <ShieldCheck size={16} />
                ¡Login exitoso! Redirigiendo…
              </div>
            )}

            <button
              type="submit"
              disabled={status === "submitting" || status === "success"}
              className="btn btn-primary w-full mt-1"
            >
              {status === "submitting" ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Conectando…
                </>
              ) : (
                "Ingresar"
              )}
            </button>
          </form>
        </div>

        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-white/80 hover:text-white transition"
        >
          <ArrowLeft size={15} />
          Volver al inicio
        </Link>
      </div>
    </section>
  );
}
