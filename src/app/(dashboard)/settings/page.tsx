import { getCurrentUser } from "@/lib/auth";
import { SettingsForm } from "@/components/SettingsForm";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">Pengaturan</h1>
        <p className="text-on-surface-variant text-sm mt-1">Atur preferensi sistem dan ambang batas anggaran Anda.</p>
      </div>
      <SettingsForm initialLimit={user.budgetLimit} />
    </div>
  );
}
