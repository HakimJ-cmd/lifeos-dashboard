export function BudgetWarningBanner({ ratio }: { ratio: number }) {
  const pct = Math.round(ratio * 100);
  return (
    <div
      role="alert"
      className="flex items-center gap-3 bg-error-container text-on-error-container rounded-card px-4 py-3 mb-6"
    >
      <span className="material-symbols-outlined">warning</span>
      <p className="text-sm font-medium">
        Pengeluaran bulan ini sudah {pct}% dari anggaran bulanan Anda. Pertimbangkan untuk mengurangi
        pengeluaran non-esensial.
      </p>
    </div>
  );
}
