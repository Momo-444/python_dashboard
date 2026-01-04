import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useTheme } from 'next-themes';

const COLORS = {
  'nouveau': '#3b82f6',
  'contacte': '#8b5cf6',
  'qualifie': '#10b981',
  'devis_envoye': '#f59e0b',
  'accepte': '#22c55e',
  'refuse': '#ef4444',
  'perdu': '#6b7280',
};

export const LeadsByStatusPie = () => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const { data: statusData, isLoading } = useQuery({
    queryKey: ['leadsByStatus'],
    queryFn: async () => {
      const { data: leads } = await supabase
        .from('leads')
        .select('statut');

      const statusCounts: Record<string, number> = {};
      leads?.forEach((lead) => {
        statusCounts[lead.statut] = (statusCounts[lead.statut] || 0) + 1;
      });

      return Object.entries(statusCounts).map(([name, value]) => ({
        name,
        value,
      }));
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Leads par statut</CardTitle>
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
        <CardTitle>Leads par statut</CardTitle>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={statusData}
              cx="50%"
              cy="45%"
              labelLine={false}
              label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                const RADIAN = Math.PI / 180;
                const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                const x = cx + radius * Math.cos(-midAngle * RADIAN);
                const y = cy + radius * Math.sin(-midAngle * RADIAN);
                return percent > 0.05 ? (
                  <text
                    x={x}
                    y={y}
                    fill="#ffffff"
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={12}
                    fontWeight="bold"
                  >
                    {`${(percent * 100).toFixed(0)}%`}
                  </text>
                ) : null;
              }}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {statusData?.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || '#8884d8'} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? '#1f2937' : '#ffffff',
                border: isDark ? '1px solid #374151' : '1px solid #e5e7eb',
                borderRadius: '8px',
                color: isDark ? '#ffffff' : '#000000'
              }}
              itemStyle={{
                color: isDark ? '#ffffff' : '#000000'
              }}
              labelStyle={{
                color: isDark ? '#ffffff' : '#000000'
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
