import { createContext, useContext, useState, type ReactNode } from "react";
import type { Nutzer, Rolle } from "../types";
import { LoginScreen } from "./LoginScreen";

interface AuthState {
  nutzer: Nutzer;
  setRolle: (r: Rolle) => void;
  darfBearbeiten: boolean;
  istAdmin: boolean;
  abmelden: () => void;
}

const SESSION_KEY = "kp.session.v1";

const NUTZER: Nutzer = {
  email: "valeska.wiedemann@dentalbauer.de",
  name: "Valeska Wiedemann",
  rolle: "admin",
};

const AuthCtx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [eingeloggt, setEingeloggt] = useState<boolean>(() =>
    sessionStorage.getItem(SESSION_KEY) === "1",
  );
  const [nutzer, setNutzer] = useState<Nutzer>(NUTZER);

  const anmelden = () => {
    sessionStorage.setItem(SESSION_KEY, "1");
    setEingeloggt(true);
  };

  const abmelden = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setEingeloggt(false);
  };

  if (!eingeloggt) {
    return <LoginScreen onSuccess={anmelden} />;
  }

  const value: AuthState = {
    nutzer,
    setRolle: (rolle) => setNutzer((n) => ({ ...n, rolle })),
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
