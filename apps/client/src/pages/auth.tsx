import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Swords } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { ApiError } from "@/lib/http";
import { cn } from "@/lib/utils";

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
    if (user) navigate("/arena", { replace: true });
  }, [user, navigate]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setPending(true);
    try {
      if (mode === "signin") await login(email, password);
      else await register(email, password);
      navigate("/arena", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="min-h-dvh bg-background px-4 py-8">
      <div className="mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-lg flex-col justify-center">
        <Link to="/" className="mb-10 flex items-center gap-2">
          <span className="grid size-10 place-items-center rounded-full bg-red-400 text-black">
            <Swords className="size-5" />
          </span>
          <span className="font-display text-4xl font-bold tracking-tighter text-red-400">
            Quick<span className="text-white">Math</span>
          </span>
        </Link>

        <p className="mb-3 px-2 text-xs font-medium text-muted-foreground">ACCOUNT</p>
        <div className="grid grid-cols-2 gap-3 p-1">
          {(
            [
              { id: "signin" as const, label: "Sign in" },
              { id: "register" as const, label: "Register" },
            ]
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setMode(item.id);
                setError("");
              }}
              className={cn(
                "group relative grid h-22 cursor-pointer place-items-center overflow-hidden rounded-[14px] border text-center",
                mode === item.id
                  ? "border-4 border-background bg-red-400 text-black ring-1 ring-red-400"
                  : "border-white/8 bg-panel text-white/15 hover:text-red-400",
              )}
            >
              <p
                className={cn(
                  "font-display absolute -bottom-4 left-1/2 -translate-x-1/2 text-5xl font-bold tracking-wide uppercase transition-all duration-300",
                  mode === item.id ? "-translate-y-7" : "translate-y-0 group-hover:-translate-y-7",
                )}
              >
                {item.label}
              </p>
            </button>
          ))}
        </div>

        <form
          key={mode}
          onSubmit={onSubmit}
          className="mt-5 rounded-3xl bg-secondary p-6 sm:p-8"
        >
          <p className="text-sm font-medium text-red-400">
            {mode === "signin" ? "WELCOME BACK" : "NEW PLAYER"}
          </p>
          <h1 className="mt-3 font-display text-5xl font-bold tracking-tighter sm:text-6xl">
            {mode === "signin" ? (
              <>
                BACK IN
                <br />
                THE ARENA
              </>
            ) : (
              <>
                CREATE
                <br />
                YOUR HANDLE
              </>
            )}
          </h1>
          <p className="mt-3 text-sm font-medium uppercase text-muted-foreground">
            Race through mental math. First correct hit wins the point.
          </p>

          <label className="mt-8 block text-xs font-semibold tracking-wide text-white/40 uppercase">
            Email
            <input
              className="mt-2 h-12 w-full rounded-2xl border border-white/10 bg-black/30 px-4 text-sm outline-none focus:border-red-400/50"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="mt-4 block text-xs font-semibold tracking-wide text-white/40 uppercase">
            Password
            <input
              className="mt-2 h-12 w-full rounded-2xl border border-white/10 bg-black/30 px-4 text-sm outline-none focus:border-red-400/50"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </label>

          {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}

          <button
            className="mt-6 h-12 w-full rounded-2xl bg-red-400 text-sm font-bold text-black press-feedback"
            disabled={pending}
            type="submit"
          >
            {pending ? "Hold on..." : mode === "signin" ? "Enter arena" : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}
