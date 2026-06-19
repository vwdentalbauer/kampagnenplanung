import { FormEvent, useState } from "react";

// SHA-256 hash von "email:passwort" – Klartext-Credentials stehen nirgends im Code.
// Hash erzeugen: node -e "require('crypto').createHash('sha256').update('email:pw').digest('hex')"
const CREDENTIAL_HASH =
  "718a5e82c8707cc770b8b80aa723834423d8a7f1c0739b27d60526c91ee124f1";

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
  onSuccess: () => void;
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
      const hash = await sha256(`${email.trim().toLowerCase()}:${pw}`);
      if (hash === CREDENTIAL_HASH) {
        onSuccess();
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
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-marke/20">
            <svg className="h-6 w-6 text-marke-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-800">Kampagnenplanung</h1>
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
