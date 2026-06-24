import { FormEvent, useState } from "react";
import { supabase } from "../lib/supabase";

/** Modal: angemeldete Person ändert ihr eigenes Passwort (ohne E-Mail-Link). */
export function PasswortAendern({ onClose }: { onClose: () => void }) {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [fehler, setFehler] = useState<string | null>(null);
  const [fertig, setFertig] = useState(false);
  const [laedt, setLaedt] = useState(false);

  const speichern = async (e: FormEvent) => {
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
    else setFertig(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
      <div className="my-16 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-marke">Passwort ändern</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            ✕
          </button>
        </div>

        {fertig ? (
          <div className="space-y-4">
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              Passwort geändert. Beim nächsten Login bitte das neue verwenden.
            </p>
            <button
              onClick={onClose}
              className="w-full rounded-lg bg-marke py-2 text-sm font-medium text-white hover:bg-marke-dark"
            >
              Schließen
            </button>
          </div>
        ) : (
          <form onSubmit={speichern} className="space-y-4">
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
        )}
      </div>
    </div>
  );
}
