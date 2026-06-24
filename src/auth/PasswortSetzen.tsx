import { FormEvent, useState } from "react";
import { supabase } from "../lib/supabase";
import { Logo } from "../components/Logo";

/**
 * Wird nach Einladungs- oder Zurücksetzen-Link angezeigt: der Nutzer ist über
 * den Link bereits angemeldet und vergibt hier sein (neues) Passwort.
 */
export function PasswortSetzen({ onFertig }: { onFertig: () => void }) {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [fehler, setFehler] = useState<string | null>(null);
  const [laedt, setLaedt] = useState(false);

  const absenden = async (e: FormEvent) => {
    e.preventDefault();
    setFehler(null);
    if (pw.length < 8) {
      setFehler("Das Passwort muss mindestens 8 Zeichen haben.");
      return;
    }
    if (pw !== pw2) {
      setFehler("Die Passwörter stimmen nicht überein.");
      return;
    }
    setLaedt(true);
    const { error } = await supabase!.auth.updateUser({ password: pw });
    setLaedt(false);
    if (error) setFehler(error.message);
    else onFertig();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-6 text-center">
          <Logo className="mx-auto mb-3 h-12 w-auto" />
          <h1 className="text-xl font-bold text-marke">Passwort festlegen</h1>
          <p className="mt-1 text-sm text-slate-500">
            Bitte vergeben Sie ein neues Passwort.
          </p>
        </div>

        <form onSubmit={absenden} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">
              Neues Passwort
            </label>
            <input
              type="password"
              autoComplete="new-password"
              required
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-marke focus:outline-none focus:ring-1 focus:ring-marke"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">
              Passwort wiederholen
            </label>
            <input
              type="password"
              autoComplete="new-password"
              required
              value={pw2}
              onChange={(e) => setPw2(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-marke focus:outline-none focus:ring-1 focus:ring-marke"
            />
          </div>

          {fehler && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">
              {fehler}
            </p>
          )}

          <button
            type="submit"
            disabled={laedt}
            className="w-full rounded-lg bg-marke py-2 text-sm font-medium text-white hover:bg-marke-dark disabled:opacity-60"
          >
            {laedt ? "Speichere…" : "Passwort speichern"}
          </button>
        </form>
      </div>
    </div>
  );
}
