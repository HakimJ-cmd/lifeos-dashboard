export function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "success" | "error";
}) {
  const toneClass =
    tone === "success" ? "text-success" : tone === "error" ? "text-error" : "text-on-surface";
  return (
    <div className="bg-surface-container-lowest rounded-card shadow-card p-5">
      <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wide">{label}</p>
      <p className={`font-display text-2xl font-bold mt-2 ${toneClass}`}>{value}</p>
      {hint && <p className="text-xs text-on-surface-variant mt-1">{hint}</p>}
    </div>
  );
}
