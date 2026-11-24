import type { Kampagne } from "../types";
import { ABGESCHLOSSEN } from "../constants";

/**
 * Wann gilt eine Kampagne als abgeschlossen?
 *
 * Früher entschied allein das Datum: Lag die letzte Maßnahme in der
 * Vergangenheit, galt die Kampagne als abgeschlossen. Dadurch verschwanden
 * laufende Kampagnen aus dem Reiter „Laufend", obwohl ihre Maßnahmen noch in
 * Arbeit waren – genau der Fall, über den sich die Nutzerinnen gewundert
 * haben.
 *
 * Maßgeblich ist deshalb der Stand der Arbeit, nicht der Kalender: Erst wenn
 * jede Maßnahme erledigt oder storniert ist, ist die Kampagne durch. Das
 * passt auch zum Fortschrittsbalken, der nach denselben Status zählt.
 */
export function istAbgeschlossen(tasks: Kampagne[]): boolean {
  if (tasks.length === 0) return false;
  return tasks.every((t) => ABGESCHLOSSEN.includes(t.status));
}
