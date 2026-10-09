// src/pages/Login.tsx
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  User as UserIcon,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";
import { API_URL } from "../config/api";

const MIN_PASSWORD = 6;
const MIN_REGISTER_PASSWORD = 8;
const REQUEST_TIMEOUT_MS = 90_000;

type Mode = "login" | "register";
type Status = "idle" | "submitting" | "success" | "error";

export default function Login() {
  const [mode, setMode] = useState<Mode>("login");

  // Campos
  const [identifier, setIdentifier] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (mode === "login") {
      if (!identifier.trim()) {
        setStatus("error");
        setErrorMsg("Ingresá tu usuario o email.");
        return;
      }
      if (password.length < MIN_PASSWORD) {
        setStatus("error");
        setErrorMsg(`La contraseña debe tener al menos ${MIN_PASSWORD} caracteres.`);
        return;
      }
    } else {
      if (!email.trim() || !email.includes("@")) {
        setStatus("error");
        setErrorMsg("Ingresá un email válido.");
        return;
      }
      if (password.length < MIN_REGISTER_PASSWORD) {
        setStatus("error");
        setErrorMsg(`La contraseña para registro debe tener al menos ${MIN_REGISTER_PASSWORD} caracteres.`);
        return;
      }
    }

    setStatus("submitting");

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const endpoint = mode === "login" ? `${API_URL}/auth/login` : `${API_URL}/auth/register`;
      const payload =
        mode === "login"
          ? { email: identifier.trim(), password }
          : { email: email.trim(), password, name: name.trim() || undefined };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        signal: controller.signal,
        body: JSON.stringify(payload),
      });
      window.clearTimeout(timeout);

      if (res.status === 401) {
        setStatus("error");
        setErrorMsg("Usuario o contraseña incorrectos.");
        return;
      }
      if (res.status === 400) {
        const data = await res.json().catch(() => null);
        setStatus("error");
        setErrorMsg(
          Array.isArray(data?.message)
            ? data.message.join(", ")
            : data?.message || "Datos inválidos."
        );
        return;
      }
      if (!res.ok) {
        setStatus("error");
        setErrorMsg(`Error del servidor (${res.status}). Reintentá en unos momentos.`);
        return;
      }

      setStatus("success");
      window.setTimeout(() => {
        // Redirigir a Mi Cuenta o a Home
        window.location.href = "/mi-cuenta";
      }, 900);
    } catch (err) {
      window.clearTimeout(timeout);
      setStatus("error");
      setErrorMsg(
        err instanceof DOMException && err.name === "AbortError"
          ? "El servidor está respondiendo lento. Reintentá en unos segundos."
          : "No pudimos conectar con el servidor. Verificá tu conexión y reintentá."
      );
    }
  };

  const inputWrap = "relative";
  const inputIcon =
    "absolute left-4 top-1/2 -translate-y-1/2 text-sage-gray pointer-events-none";

  return (
    <section className="min-h-[calc(100vh-var(--navbar-h))] bg-midnight-forest flex items-center justify-center container-x py-12 md:py-20">
      <div className="w-full max-w-sm">
        <div className="bg-deep-lichen border border-spruce-border text-white rounded-xl p-8 shadow-subtle">
          {/* Selector Login / Registro */}
          <div className="flex border-b border-spruce-border mb-6">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setErrorMsg("");
                setStatus("idle");
              }}
              className={`flex-1 pb-3 text-sm font-semibold transition-colors border-b-2 -mb-px ${
                mode === "login"
                  ? "border-accent-brand text-white"
                  : "border-transparent text-sage-gray hover:text-white"
              }`}
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setErrorMsg("");
                setStatus("idle");
              }}
              className={`flex-1 pb-3 text-sm font-semibold transition-colors border-b-2 -mb-px ${
                mode === "register"
                  ? "border-accent-brand text-white"
                  : "border-transparent text-sage-gray hover:text-white"
              }`}
            >
              Crear cuenta
            </button>
          </div>

          <span className="eyebrow">
            {mode === "login" ? "Acceso" : "Nuevo cliente"}
          </span>
          <h1 className="h1 mt-1 text-white">
            {mode === "login" ? "Bienvenido" : "Crear mi cuenta"}
          </h1>
          <p className="text-sm text-sage-gray mt-2">
            {mode === "login"
              ? "Ingresá con tu cuenta para ver tus pedidos y favoritos."
              : "Registrate para guardar tus pedidos, direcciones y favoritos."}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4" noValidate>
            {mode === "register" && (
              <div>
                <label htmlFor="name" className="eyebrow mb-1.5 block">
                  Nombre completo (opcional)
                </label>
                <div className={inputWrap}>
                  <UserIcon size={16} className={inputIcon} />
                  <input
                    id="name"
                    type="text"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Tu nombre y apellido"
                    className="input-base pl-11"
                  />
                </div>
              </div>
            )}

            {mode === "login" ? (
              <div>
                <label htmlFor="identifier" className="eyebrow mb-1.5 block">
                  Usuario o Email
                </label>
                <div className={inputWrap}>
                  <UserIcon size={16} className={inputIcon} />
                  <input
                    id="identifier"
                    type="text"
                    autoComplete="username"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="usuario@ejemplo.com o tu usuario"
                    className="input-base pl-11"
                    aria-invalid={status === "error"}
                  />
                </div>
              </div>
            ) : (
              <div>
                <label htmlFor="email" className="eyebrow mb-1.5 block">
                  Correo electrónico
                </label>
                <div className={inputWrap}>
                  <Mail size={16} className={inputIcon} />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tunombre@ejemplo.com"
                    className="input-base pl-11"
                    aria-invalid={status === "error"}
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="password" className="eyebrow mb-1.5 block">
                Contraseña
              </label>
              <div className={inputWrap}>
                <Lock size={16} className={inputIcon} />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "register" ? "Mínimo 8 caracteres" : "••••••••"}
                  className="input-base pl-11 pr-12"
                  aria-invalid={status === "error"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 grid place-items-center rounded-md text-sage-gray hover:bg-white/10 hover:text-white transition cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {mode === "register" && (
                <p className="text-[11px] text-sage-gray mt-1">
                  Debe contener al menos 8 caracteres.
                </p>
              )}
            </div>

            {errorMsg && (
              <div
                role="alert"
                className="flex items-start gap-2 copy text-[rgb(var(--color-danger-text))]"
              >
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {status === "success" && (
              <div className="flex items-center gap-2 copy text-[rgb(var(--color-success-text))]">
                <ShieldCheck size={16} />
                {mode === "login"
                  ? "¡Login exitoso! Redirigiendo…"
                  : "¡Cuenta creada! Ingresando…"}
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
                  {mode === "login" ? "Conectando…" : "Registrando…"}
                </>
              ) : mode === "login" ? (
                "Ingresar"
              ) : (
                "Registrarme"
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
