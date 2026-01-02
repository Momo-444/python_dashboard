import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Lead } from '@/types/database';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Trash2, Edit, FileText, Filter, Flame, Download } from 'lucide-react';
import { toast } from 'sonner';
import { LeadDialog } from '@/components/leads/LeadDialog';
import { cn } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/StatusBadge';  // ajuste le chemin si besoin
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { exportToExcel, leadsExportColumns } from '@/lib/exportExcel';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function LeadsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const { canDelete, canEdit } = useUserRole();
  const queryClient = useQueryClient();

  const { data: leads, isLoading } = useQuery({
    queryKey: ['leads', search, statusFilter],
    queryFn: async () => {
      let query = supabase.from('leads').select('*').order('created_at', { ascending: false });

      if (search) {
        query = query.or(`nom.ilike.%${search}%,email.ilike.%${search}%,ville.ilike.%${search}%`);
      }

      if (statusFilter !== 'all') {
        query = query.eq('statut', statusFilter);
      }

      const { data } = await query;
      return (data as unknown as Lead[]) || [];
    },
  });

  // Realtime subscription - Optimisé avec mise à jour directe du cache
  useEffect(() => {
    const channel = supabase
      .channel('leads-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'leads' },
        (payload) => {
          queryClient.setQueryData(['leads', '', 'all'], (old: Lead[] | undefined) =>
            old ? [payload.new as Lead, ...old] : [payload.new as Lead]
          );
          // Invalider aussi les autres variantes de queryKey pour les filtres
          queryClient.invalidateQueries({ queryKey: ['leads'], exact: false });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'leads' },
        (payload) => {
          queryClient.setQueryData(['leads', '', 'all'], (old: Lead[] | undefined) =>
            old?.map(lead => lead.id === (payload.new as Lead).id ? payload.new as Lead : lead) ?? []
          );
          queryClient.invalidateQueries({ queryKey: ['leads'], exact: false });
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'leads' },
        (payload) => {
          queryClient.setQueryData(['leads', '', 'all'], (old: Lead[] | undefined) =>
            old?.filter(lead => lead.id !== (payload.old as Lead).id) ?? []
          );
          queryClient.invalidateQueries({ queryKey: ['leads'], exact: false });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('leads').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead supprimé avec succès');
      setDeleteId(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de la suppression');
    },
  });

  const handleSendDevis = async (lead: Lead) => {
    try {
      toast.loading('Envoi du devis en cours...');

      const apiUrl = import.meta.env.VITE_API_URL;
      const webhookSecret = import.meta.env.VITE_WEBHOOK_SECRET;

      if (!apiUrl || !webhookSecret) {
        throw new Error('Configuration API manquante');
      }

      const response = await fetch(`${apiUrl}/api/v1/devis/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Secret': webhookSecret
        },
        body: JSON.stringify({
          lead_id: lead.id,
          // Priorité au budget négocié s'il existe (mis à jour manuellement), sinon l'estimé
          budget_negocie: lead.budget_negocie || lead.budget_estime || undefined,
          notes_devis_custom: "Devis généré depuis le dashboard",
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || 'Erreur lors de la création du devis');
      }

      // Le devis est créé et envoyé par l'API, on peut notifier l'utilisateur
      toast.dismiss();
      toast.success('Devis généré et envoyé avec succès via l\'API V2');

      // Invalidations pour rafraîchir l'UI
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['devis'] });
      queryClient.invalidateQueries({ queryKey: ['latestDevisList'] });
    } catch (error) {
      toast.dismiss();
      toast.error('Erreur lors de l\'envoi du devis');
      console.error('Erreur:', error);
    }
  };



  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
          <p className="text-muted-foreground">Gérez vos prospects</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              if (leads && leads.length > 0) {
                exportToExcel(leads, leadsExportColumns, 'leads_export');
                toast.success('Export Excel téléchargé');
              } else {
                toast.error('Aucune donnée à exporter');
              }
            }}
          >
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          {canEdit && (
            <Button onClick={() => {
              setSelectedLead(null);
              setDialogOpen(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau lead
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, email, ville..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="nouveau">Nouveau</SelectItem>
            <SelectItem value="contacte">Contacté</SelectItem>
            <SelectItem value="qualifie">Qualifié</SelectItem>
            <SelectItem value="devis_envoye">Devis envoyé</SelectItem>
            <SelectItem value="accepte">Accepté</SelectItem>
            <SelectItem value="refuse">Refusé</SelectItem>
            <SelectItem value="perdu">Perdu</SelectItem>
            <SelectItem value="chaud">Chaud</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {leads?.map((lead) => (
            <Card key={lead.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {lead.nom} {lead.prenom}
                    {/* Affiche le feu UNIQUEMENT si le lead a ouvert l'email ET cliqué sur le bouton */}
                    {(lead.ouvert === "oui" && lead.clique === "oui") && (
                      <Flame className="h-5 w-5 text-orange-500 fill-orange-500 animate-pulse" />
                    )}
                  </CardTitle>
                  <StatusBadge statut={lead.statut as StatusType} />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {lead.email && <p className="text-sm text-muted-foreground">{lead.email}</p>}
                {lead.telephone && <p className="text-sm text-muted-foreground">{lead.telephone}</p>}
                {lead.ville && <p className="text-sm text-muted-foreground">{lead.ville}</p>}
                {lead.type_projet && (
                  <p className="text-sm">
                    <span className="font-medium">Type: </span>
                    {lead.type_projet}
                  </p>
                )}

                <div className="flex flex-col gap-2 pt-4">
                  {canEdit && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleSendDevis(lead)}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Envoyer devis
                    </Button>
                  )}
                  <div className="flex gap-2">
                    {canEdit && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setSelectedLead(lead);
                          setDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Modifier
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteId(lead.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce lead ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <LeadDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        lead={selectedLead}
      />
    </div>
  );
}

