import type { Status } from "../types";
import { STATUS_LABELS, STATUS_STYLE } from "../constants";

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
