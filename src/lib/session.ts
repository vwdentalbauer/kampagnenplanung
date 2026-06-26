// Aktuelle Sitzung als Modul-Status, damit auch Nicht-React-Code (z.B. das
// Repository) weiß, wer gerade angemeldet ist. Wird vom AuthContext gesetzt.

let aktuelleUserId: string | null = null;
let aktuellerName = "";

export function setzeSitzung(userId: string | null, name: string): void {
  aktuelleUserId = userId;
  aktuellerName = name;
}

export function aktuelleSitzungUserId(): string | null {
  return aktuelleUserId;
}

export function aktuelleSitzungName(): string {
  return aktuellerName;
}
