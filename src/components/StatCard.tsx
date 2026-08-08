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

  // Ukuran font menyesuaikan panjang angka: makin panjang, makin kecil,
  // supaya angka besar (misal saldo puluhan juta) tetap tampil utuh satu baris.
  const len = value.length;
  const sizeClass =
    len <= 8 ? "text-xl sm:text-2xl" : len <= 11 ? "text-lg sm:text-xl" : len <= 14 ? "text-base sm:text-lg" : len <= 17 ? "text-sm sm:text-base" : "text-xs sm:text-sm";

  return (
    <div className="bg-surface-container-lowest rounded-card shadow-card p-5 min-w-0">
      <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wide truncate">{label}</p>
      <p className={`font-display font-bold mt-2 truncate ${sizeClass} ${toneClass}`} title={value}>{value}</p>
      {hint && <p className="text-xs text-on-surface-variant mt-1 truncate">{hint}</p>}
    </div>
  );
}