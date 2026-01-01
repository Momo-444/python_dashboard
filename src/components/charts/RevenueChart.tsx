import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';

// Fonction pour parser correctement les dates PostgreSQL
const parsePostgresDate = (dateString: string): Date => {
  if (!dateString) return new Date(0);
  // PostgreSQL retourne "2025-12-30 12:11:02+00", on remplace l'espace par T pour ISO
  const isoString = dateString.replace(' ', 'T');
  return new Date(isoString);
};

export const RevenueChart = () => {
  const { data: revenueData, isLoading } = useQuery({
    queryKey: ['revenueChart'],
    queryFn: async () => {
      const months = [];
      for (let i = 11; i >= 0; i--) {
        const month = subMonths(startOfMonth(new Date()), i);
        months.push(month);
      }

      const { data: devis } = await supabase
        .from('devis')
        .select('montant_ttc, date_creation')
        .in('statut', ['payes', 'payés', 'paye', 'payé', 'Payé', 'signe', 'signé', 'Signé', 'accepte', 'accepté', 'Accepté']);

      const chartData = months.map((month) => {
        const monthStart = startOfMonth(month);
        const monthEnd = endOfMonth(month); // Utilise endOfMonth pour inclure tout le dernier jour

        const monthRevenue = devis?.filter((d) => {
          const devisDate = parsePostgresDate(d.date_creation);
          return devisDate >= monthStart && devisDate <= monthEnd;
        }).reduce((sum, d) => sum + (d.montant_ttc || 0), 0) || 0;

        return {
          month: format(month, 'MMM', { locale: fr }),
          revenue: monthRevenue,
        };
      });

      return chartData;
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Chiffre d'affaires (12 mois)</CardTitle>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <p className="text-muted-foreground">Chargement...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Chiffre d'affaires (12 mois)</CardTitle>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="month"
              className="text-xs"
            />
            <YAxis
              className="text-xs"
              tickFormatter={(value) => `${value.toLocaleString()}€`}
            />
            <Tooltip
              formatter={(value: number) => [`${value.toLocaleString('fr-FR')} €`, 'CA']}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))'
              }}
            />
            <Bar dataKey="revenue" fill="hsl(var(--primary))" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
