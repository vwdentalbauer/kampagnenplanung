import { createContext, useContext, useState, type ReactNode } from "react";
import type { Nutzer, Rolle } from "../types";
import { LoginScreen } from "./LoginScreen";
import { findeNutzer } from "./users";

interface AuthState {
  nutzer: Nutzer;
  setRolle: (r: Rolle) => void;
  darfBearbeiten: boolean;
  istAdmin: boolean;
  abmelden: () => void;
}

const SESSION_KEY = "kp.session.v2";

const AuthCtx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Eingeloggten Nutzer aus der Session wiederherstellen.
  const [nutzer, setNutzer] = useState<Nutzer | null>(() => {
    const email = sessionStorage.getItem(SESSION_KEY);
    return email ? (findeNutzer(email) ?? null) : null;
  });

  const anmelden = (n: Nutzer) => {
    sessionStorage.setItem(SESSION_KEY, n.email);
    setNutzer(n);
  };

  const abmelden = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setNutzer(null);
  };

  if (!nutzer) {
    return <LoginScreen onSuccess={anmelden} />;
  }

  const value: AuthState = {
    nutzer,
    setRolle: (rolle) => setNutzer((n) => (n ? { ...n, rolle } : n)),
    darfBearbeiten: nutzer.rolle === "editor" || nutzer.rolle === "admin",
    istAdmin: nutzer.rolle === "admin",
    abmelden,
  };

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth muss innerhalb von AuthProvider genutzt werden");
  return ctx;
}
