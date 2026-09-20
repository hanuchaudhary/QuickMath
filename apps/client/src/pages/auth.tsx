import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";
import { ApiError } from "@/lib/http";

export function AuthPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);
  const [mode, setMode] = useState<"signin" | "register">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (user) navigate("/", { replace: true });
  }, [user, navigate]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setPending(true);
    try {
      if (mode === "signin") await login(email, password);
      else await register(email, password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid min-h-dvh place-items-center bg-background px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-[28px] border border-white/8 bg-panel p-8 shadow-[0_0_80px_rgba(182,255,59,0.08)]"
      >
        <p className="font-display text-sm font-bold tracking-[0.24em] text-lime">MATIKS</p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
          {mode === "signin" ? "Back in the arena" : "Create your handle"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Race through mental math. First correct hit wins the point.
        </p>

        <label className="mt-8 block text-xs font-semibold tracking-wide text-white/50 uppercase">
          Email
          <input
            className="mt-2 h-12 w-full rounded-2xl border border-white/10 bg-black/40 px-4 text-sm outline-none focus:border-lime/60"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="mt-4 block text-xs font-semibold tracking-wide text-white/50 uppercase">
          Password
          <input
            className="mt-2 h-12 w-full rounded-2xl border border-white/10 bg-black/40 px-4 text-sm outline-none focus:border-lime/60"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
        </label>

        {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}

        <button
          className="mt-6 h-12 w-full rounded-2xl bg-lime text-sm font-bold text-black press-feedback"
          disabled={pending}
          type="submit"
        >
          {pending ? "Hold on..." : mode === "signin" ? "Enter arena" : "Create account"}
        </button>

        <button
          type="button"
          className="mt-4 w-full text-sm text-white/50"
          onClick={() => setMode(mode === "signin" ? "register" : "signin")}
        >
          {mode === "signin" ? "Need an account? Register" : "Have an account? Sign in"}
        </button>
        <Link to="/" className="sr-only">
          Home
        </Link>
      </form>
    </div>
  );
}
