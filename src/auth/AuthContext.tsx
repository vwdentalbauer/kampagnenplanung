import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Nutzer } from "../types";
import { supabase, supabaseAktiv } from "../lib/supabase";
import { setzeSitzung } from "../lib/session";
import { LoginScreen } from "./LoginScreen";
import { PasswortSetzen } from "./PasswortSetzen";

interface AuthState {
  nutzer: Nutzer;
  /** Supabase-User-ID (für Sperren & individuelle Einstellungen). */
  userId: string | null;
  darfBearbeiten: boolean;
  istAdmin: boolean;
  abmelden: () => void;
}

const AuthCtx = createContext<AuthState | null>(null);

/** Demo-Nutzer für den lokalen Modus ohne Supabase-Backend. */
const DEMO_NUTZER: Nutzer = {
  email: "demo@local",
  name: "Demo (lokal)",
  rolle: "admin",
};

interface Profil {
  id: string;
  email: string;
  name: string;
  rolle: Nutzer["rolle"];
  aktiv: boolean;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // --- Lokaler Demo-Modus (kein Backend konfiguriert) -------------------
  if (!supabaseAktiv || !supabase) {
    const value: AuthState = {
      nutzer: DEMO_NUTZER,
      userId: null,
      darfBearbeiten: true,
      istAdmin: true,
      abmelden: () => {},
    };
    return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
  }

  return <SupabaseAuth>{children}</SupabaseAuth>;
}

function SupabaseAuth({ children }: { children: ReactNode }) {
  const [laden, setLaden] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [profil, setProfil] = useState<Profil | null>(null);
  // Invite-/Reset-Link: Nutzer muss zuerst ein Passwort setzen.
  const [passwortModus, setPasswortModus] = useState(
    () =>
      typeof window !== "undefined" &&
      /type=(invite|recovery)/.test(window.location.hash),
  );

  async function profilLaden(uid: string) {
    const { data } = await supabase!
      .from("profile")
      .select("id, email, name, rolle, aktiv")
      .eq("id", uid)
      .maybeSingle();
    setProfil((data as Profil) ?? null);
  }

  useEffect(() => {
    supabase!.auth.getSession().then(async ({ data }) => {
      const uid = data.session?.user.id ?? null;
      setUserId(uid);
      if (uid) await profilLaden(uid);
      setLaden(false);
    });

    const { data: sub } = supabase!.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") setPasswortModus(true);
      const uid = session?.user.id ?? null;
      setUserId(uid);
      if (uid) profilLaden(uid);
      else setProfil(null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Sitzung für Nicht-React-Code (Repository) spiegeln – für updated_by.
  useEffect(() => {
    setzeSitzung(userId, profil?.name ?? "");
  }, [userId, profil]);

  const abmelden = () => {
    supabase!.auth.signOut();
    setProfil(null);
    setUserId(null);
  };

  if (passwortModus) {
    return (
      <PasswortSetzen
        onFertig={() => {
          // Hash entfernen und normal weiter.
          history.replaceState(null, "", window.location.pathname + window.location.search);
          setPasswortModus(false);
        }}
      />
    );
  }

  if (laden) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-400">
        Lädt…
      </div>
    );
  }

  if (!userId) {
    return <LoginScreen />;
  }

  // Eingeloggt, aber kein/gesperrtes Profil -> kein Zugriff.
  if (!profil || !profil.aktiv) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-lg">
          <h1 className="mb-2 text-lg font-bold text-marke">Kein Zugriff</h1>
          <p className="mb-6 text-sm text-slate-500">
            Ihr Konto ist nicht (mehr) freigeschaltet. Bitte wenden Sie sich an
            eine Administratorin.
          </p>
          <button
            onClick={abmelden}
            className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
          >
            Abmelden
          </button>
        </div>
      </div>
    );
  }

  const value: AuthState = {
    nutzer: { email: profil.email, name: profil.name, rolle: profil.rolle },
    userId,
    darfBearbeiten: profil.rolle === "editor" || profil.rolle === "admin",
    istAdmin: profil.rolle === "admin",
    abmelden,
  };

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth muss innerhalb von AuthProvider genutzt werden");
  return ctx;
}
