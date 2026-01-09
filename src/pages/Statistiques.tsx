import { RevenueChart } from '@/components/charts/RevenueChart';
import { LeadsByStatusPie } from '@/components/charts/LeadsByStatusPie';
import { TopClientsBar } from '@/components/charts/TopClientsBar';
import { RapportGenerator } from '@/components/rapport/RapportGenerator';
import { useUserRole } from '@/hooks/useUserRole';

export default function StatistiquesPage() {
  const { isAdmin } = useUserRole();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Statistiques</h1>
        <p className="text-muted-foreground">Analysez vos performances</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <RevenueChart />
        <LeadsByStatusPie />
      </div>

      <TopClientsBar />

      {/* Section Rapport - Visible uniquement pour les admins */}
      {isAdmin && (
        <div className="pt-4 border-t">
          <RapportGenerator />
        </div>
      )}
    </div>
  );
}
