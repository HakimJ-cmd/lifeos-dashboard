import { ClientBoard } from "@/components/ClientBoard";

export default function ClientsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">Klien</h1>
        <p className="text-on-surface-variant text-sm mt-1">
          Kelola akun client Anda dan proyek mana yang bisa mereka lihat progresnya.
        </p>
      </div>
      <ClientBoard />
    </div>
  );
}
