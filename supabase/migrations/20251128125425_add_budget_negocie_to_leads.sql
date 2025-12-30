-- Ajouter la colonne budget_negocie à la table leads
-- Cette colonne permet de saisir manuellement un budget négocié avec le client
-- Si cette valeur est présente, elle remplace le calcul automatique de l'IA

ALTER TABLE public.leads 
ADD COLUMN budget_negocie NUMERIC;

-- Ajouter un commentaire pour documenter la colonne
COMMENT ON COLUMN public.leads.budget_negocie IS 'Budget négocié manuellement avec le client (en euros HT). Si rempli, remplace le calcul automatique de l''IA lors de la génération du devis.';
