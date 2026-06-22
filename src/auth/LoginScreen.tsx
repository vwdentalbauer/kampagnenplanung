import { FormEvent, useState } from "react";
import type { Nutzer } from "../types";
import { NUTZER_LISTE } from "./users";
import { Logo } from "../components/Logo";

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(text),
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

interface Props {
  onSuccess: (nutzer: Nutzer) => void;
}

export function LoginScreen({ onSuccess }: Props) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [fehler, setFehler] = useState(false);
  const [laedt, setLaedt] = useState(false);

  const absenden = async (e: FormEvent) => {
    e.preventDefault();
    setFehler(false);
    setLaedt(true);
    try {
      const e_ = email.trim().toLowerCase();
      const hash = await sha256(`${e_}:${pw}`);
      const treffer = NUTZER_LISTE.find((n) => n.email === e_ && n.hash === hash);
      if (treffer) {
        onSuccess({ email: treffer.email, name: treffer.name, rolle: treffer.rolle });
      } else {
        setFehler(true);
      }
    } finally {
      setLaedt(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-6 text-center">
          <Logo className="mx-auto mb-3 h-12 w-auto" />
          <h1 className="text-xl font-bold text-marke">Kampagnenplanung</h1>
          <p className="mt-1 text-sm text-slate-500">Bitte anmelden</p>
        </div>

        <form onSubmit={absenden} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">
              E-Mail
            </label>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-marke focus:outline-none focus:ring-1 focus:ring-marke"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">
              Passwort
            </label>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-marke focus:outline-none focus:ring-1 focus:ring-marke"
            />
          </div>

          {fehler && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">
              E-Mail oder Passwort falsch.
            </p>
          )}

          <button
            type="submit"
            disabled={laedt}
            className="w-full rounded-lg bg-marke py-2 text-sm font-medium text-white hover:bg-marke-dark disabled:opacity-60"
          >
            {laedt ? "Prüfe…" : "Anmelden"}
          </button>
        </form>
      </div>
    </div>
  );
}
