import { ClientProgressBoard } from "@/components/ClientProgressBoard";

export default function ClientProgressPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">Progress Proyek Anda</h1>
        <p className="text-on-surface-variant text-sm mt-1">
          Ringkasan status dan progres proyek yang sedang kami kerjakan untuk Anda.
        </p>
      </div>
      <ClientProgressBoard />
    </div>
  );
}
