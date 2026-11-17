import type { ReactNode } from "react";
import { HelpCircle } from "lucide-react";
export function Badge({
  children,
  tone = "muted",
}: {
  children: ReactNode;
  tone?: "good" | "warn" | "bad" | "muted";
}) {
  return (
    <span className={`badge badge-${tone}`}>
      <span className="badge-dot" />
      {children}
    </span>
  );
}
export function Stat({
  label,
  value,
  note,
  tone,
}: {
  label: string;
  value: ReactNode;
  note?: string;
  tone?: string;
}) {
  return (
    <div className="stat">
      <p>{label}</p>
      <strong className={tone}>{value}</strong>
      {note && <small>{note}</small>}
    </div>
  );
}
export function Panel({
  title,
  subtitle,
  children,
  aside,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}
export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="empty">
      <HelpCircle size={22} />
      <p>{children}</p>
    </div>
  );
}
export function JsonDetails({
  label,
  value,
}: {
  label: string;
  value: unknown;
}) {
  return (
    <details className="json-details">
      <summary>{label}</summary>
      <pre>
        {value == null
          ? "Unavailable from service"
          : JSON.stringify(value, null, 2)}
      </pre>
    </details>
  );
}
