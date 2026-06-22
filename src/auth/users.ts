import type { Nutzer } from "../types";

// Hardcodierte Zugänge. Passwort steht NICHT im Code – nur der SHA-256-Hash
// von "email:passwort" (E-Mail kleingeschrieben).
// Hash erzeugen:
//   node -e "console.log(require('crypto').createHash('sha256').update('email:pw').digest('hex'))"
export interface NutzerMitHash extends Nutzer {
  hash: string;
}

export const NUTZER_LISTE: NutzerMitHash[] = [
  {
    email: "valeska.wiedemann@dentalbauer.de",
    name: "Valeska Wiedemann",
    rolle: "admin",
    hash: "718a5e82c8707cc770b8b80aa723834423d8a7f1c0739b27d60526c91ee124f1",
  },
  {
    email: "nina.rechmann@dentalbauer.de",
    name: "Nina Rechmann",
    rolle: "editor",
    hash: "4c7369bc90800005f583e96ea0880f1c274baa89a992e3381b071f508d6ba720",
  },
  {
    email: "axel.meiling@dentalbauer.de",
    name: "Axel Meiling",
    rolle: "editor",
    hash: "ccd33aa9adad5b35f47795313f77ff6cd5343d26e52ce9edbeb1f41ea8109313",
  },
  {
    email: "ivana.josipovic@dentalbauer.de",
    name: "Ivana Josipovic",
    rolle: "editor",
    hash: "c560b3a876edc874c79ec03767724037928e20ba9adf8a30b71935ceadd137ff",
  },
];

/** Nutzer (ohne Hash) anhand der E-Mail finden. */
export function findeNutzer(email: string): Nutzer | undefined {
  const e = email.trim().toLowerCase();
  const treffer = NUTZER_LISTE.find((n) => n.email === e);
  if (!treffer) return undefined;
  return { email: treffer.email, name: treffer.name, rolle: treffer.rolle };
}
