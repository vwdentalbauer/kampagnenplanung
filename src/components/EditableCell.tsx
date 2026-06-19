import { useEffect, useState } from "react";

interface Props {
  value: string;
  onCommit: (neu: string) => void;
  multiline?: boolean;
  type?: "text" | "number" | "date";
  placeholder?: string;
  className?: string;
}

/**
 * Inline-bearbeitbare Tabellenzelle. Sieht aus wie Text, wird beim Klick zum
 * Eingabefeld und speichert beim Verlassen (onBlur) oder mit Enter.
 */
export function EditableCell({
  value,
  onCommit,
  multiline = false,
  type = "text",
  placeholder,
  className = "",
}: Props) {
  const [wert, setWert] = useState(value);

  useEffect(() => {
    setWert(value);
  }, [value]);

  const speichern = () => {
    if (wert !== value) onCommit(wert);
  };

  const basis =
    "w-full rounded border border-transparent bg-transparent px-1.5 py-1 text-sm hover:border-slate-200 focus:border-marke focus:bg-white focus:outline-none focus:ring-1 focus:ring-marke";

  if (multiline) {
    return (
      <textarea
        rows={2}
        className={`${basis} resize-y whitespace-pre-line ${className}`}
        value={wert}
        placeholder={placeholder}
        onChange={(e) => setWert(e.target.value)}
        onBlur={speichern}
      />
    );
  }

  return (
    <input
      type={type}
      className={`${basis} ${className}`}
      value={wert}
      placeholder={placeholder}
      onChange={(e) => setWert(e.target.value)}
      onBlur={speichern}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          (e.target as HTMLInputElement).blur();
        }
      }}
    />
  );
}
