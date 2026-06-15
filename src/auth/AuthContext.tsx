import { createContext, useContext, useState, type ReactNode } from "react";
import type { Nutzer, Rolle } from "../types";

/**
 * Mock-Authentifizierung für die Architektur-/Demophase.
 *
 * Es gibt bereits ein vollständiges Rollenmodell (viewer/editor/admin).
 * Die eigentliche Anmeldung + Nutzerverwaltung kommt später über Supabase
 * Auth – dann wird hier lediglich der Provider ausgetauscht, die
 * `useAuth()`-API für die UI bleibt gleich.
 */
interface AuthState {
  nutzer: Nutzer;
  setRolle: (r: Rolle) => void;
  darfBearbeiten: boolean;
  istAdmin: boolean;
}

const DEMO_NUTZER: Nutzer = {
  email: "demo@dentalbauer.de",
  name: "Demo-Nutzer",
  rolle: "admin",
};

const AuthCtx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [nutzer, setNutzer] = useState<Nutzer>(DEMO_NUTZER);

  const value: AuthState = {
    nutzer,
    setRolle: (rolle) => setNutzer((n) => ({ ...n, rolle })),
    darfBearbeiten: nutzer.rolle === "editor" || nutzer.rolle === "admin",
    istAdmin: nutzer.rolle === "admin",
  };

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth muss innerhalb von AuthProvider genutzt werden");
  return ctx;
}
