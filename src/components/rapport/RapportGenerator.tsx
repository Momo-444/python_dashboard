import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { FileText, Mail, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const MOIS = [
  { value: '1', label: 'Janvier' },
  { value: '2', label: 'Février' },
  { value: '3', label: 'Mars' },
  { value: '4', label: 'Avril' },
  { value: '5', label: 'Mai' },
  { value: '6', label: 'Juin' },
  { value: '7', label: 'Juillet' },
  { value: '8', label: 'Août' },
  { value: '9', label: 'Septembre' },
  { value: '10', label: 'Octobre' },
  { value: '11', label: 'Novembre' },
  { value: '12', label: 'Décembre' },
];

// Générer les années (année actuelle - 2 jusqu'à année actuelle)
const currentYear = new Date().getFullYear();
const ANNEES = [
  { value: String(currentYear - 2), label: String(currentYear - 2) },
  { value: String(currentYear - 1), label: String(currentYear - 1) },
  { value: String(currentYear), label: String(currentYear) },
];

type Status = 'idle' | 'loading' | 'success' | 'error';

export function RapportGenerator() {
  // Par défaut : mois précédent
  const defaultMonth = new Date().getMonth(); // 0-11, donc getMonth() donne le mois précédent en 1-12
  const defaultYear = defaultMonth === 0 ? currentYear - 1 : currentYear;
  const defaultMonthValue = defaultMonth === 0 ? '12' : String(defaultMonth);

  const [mois, setMois] = useState(defaultMonthValue);
  const [annee, setAnnee] = useState(String(defaultYear));
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  const handleGenerate = async () => {
    setStatus('loading');
    setMessage('');

    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const webhookSecret = import.meta.env.VITE_WEBHOOK_SECRET;

      if (!apiUrl || !webhookSecret) {
        throw new Error('Configuration API manquante');
      }

      const response = await fetch(`${apiUrl}/api/v1/rapport/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Secret': webhookSecret,
        },
        body: JSON.stringify({
          mois: parseInt(mois),
          annee: parseInt(annee),
          envoyer_email: true,
          email_destinataire: null, // Utilise l'email admin par défaut
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Erreur lors de la génération');
      }

      setStatus('success');
      const moisLabel = MOIS.find(m => m.value === mois)?.label || mois;
      setMessage(`Rapport ${moisLabel} ${annee} envoyé avec succès !`);

      toast.success('Rapport envoyé !', {
        description: `Le rapport de ${moisLabel} ${annee} a été envoyé par email.`,
      });

    } catch (error) {
      setStatus('error');
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      setMessage(errorMessage);

      toast.error('Erreur', {
        description: errorMessage,
      });
    }
  };

  const getMoisLabel = () => {
    return MOIS.find(m => m.value === mois)?.label || 'Sélectionner';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Générer un rapport mensuel
        </CardTitle>
        <CardDescription>
          Sélectionnez le mois et l'année pour générer et recevoir le rapport par email
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          {/* Sélecteurs */}
          <div className="flex flex-wrap gap-4">
            {/* Sélecteur de mois */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Mois</label>
              <Select value={mois} onValueChange={setMois}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sélectionner le mois" />
                </SelectTrigger>
                <SelectContent>
                  {MOIS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sélecteur d'année */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Année</label>
              <Select value={annee} onValueChange={setAnnee}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Année" />
                </SelectTrigger>
                <SelectContent>
                  {ANNEES.map((a) => (
                    <SelectItem key={a.value} value={a.value}>
                      {a.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Bouton de génération */}
          <Button
            onClick={handleGenerate}
            disabled={status === 'loading'}
            className="w-fit"
          >
            {status === 'loading' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Génération en cours...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Générer et envoyer le rapport
              </>
            )}
          </Button>

          {/* Message de statut */}
          {status === 'success' && (
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
              <CheckCircle className="h-4 w-4" />
              {message}
            </div>
          )}

          {status === 'error' && (
            <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="h-4 w-4" />
              {message}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
