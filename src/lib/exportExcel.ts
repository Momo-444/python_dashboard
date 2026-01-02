import * as XLSX from 'xlsx';

export interface ExportColumn<T> {
  header: string;
  key: keyof T;
  format?: 'date' | 'datetime' | 'currency' | 'percent';
}

/**
 * Formate une valeur selon le type spécifié
 */
function formatValue(value: unknown, format?: ExportColumn<unknown>['format']): string | number {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  switch (format) {
    case 'date':
      try {
        const date = new Date(value as string);
        if (isNaN(date.getTime())) return String(value);
        return date.toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });
      } catch {
        return String(value);
      }

    case 'datetime':
      try {
        const datetime = new Date(value as string);
        if (isNaN(datetime.getTime())) return String(value);
        return datetime.toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      } catch {
        return String(value);
      }

    case 'currency':
      const num = Number(value);
      if (isNaN(num)) return String(value);
      return num.toLocaleString('fr-FR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }) + ' €';

    case 'percent':
      const pct = Number(value);
      if (isNaN(pct)) return String(value);
      return pct + ' %';

    default:
      return String(value);
  }
}

/**
 * Exporte des données vers un fichier Excel (.xlsx)
 * @param data - Tableau de données à exporter
 * @param columns - Configuration des colonnes (header, key, format)
 * @param filename - Nom du fichier (sans extension)
 */
export function exportToExcel<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn<T>[],
  filename: string
): void {
  if (!data || data.length === 0) {
    alert('Aucune donnée à exporter');
    return;
  }

  // Créer les en-têtes
  const headers = columns.map((col) => col.header);

  // Créer les lignes de données
  const rows = data.map((item) =>
    columns.map((col) => formatValue(item[col.key], col.format))
  );

  // Créer la feuille de calcul
  const worksheetData = [headers, ...rows];
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // Ajuster la largeur des colonnes automatiquement
  const colWidths = columns.map((col, index) => {
    const maxLength = Math.max(
      col.header.length,
      ...rows.map((row) => String(row[index]).length)
    );
    return { wch: Math.min(maxLength + 2, 50) };
  });
  worksheet['!cols'] = colWidths;

  // Créer le classeur
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Export');

  // Générer le nom de fichier avec la date
  const today = new Date().toISOString().split('T')[0];
  const fullFilename = `${filename}_${today}.xlsx`;

  // Télécharger le fichier
  XLSX.writeFile(workbook, fullFilename);
}

// ==========================================
// Configurations d'export prédéfinies
// ==========================================

export const leadsExportColumns: ExportColumn<Record<string, unknown>>[] = [
  { header: 'Nom', key: 'nom' },
  { header: 'Prénom', key: 'prenom' },
  { header: 'Email', key: 'email' },
  { header: 'Téléphone', key: 'telephone' },
  { header: 'Ville', key: 'ville' },
  { header: 'Code postal', key: 'code_postal' },
  { header: 'Adresse', key: 'adresse' },
  { header: 'Type de projet', key: 'type_projet' },
  { header: 'Surface (m²)', key: 'surface' },
  { header: 'Budget estimé', key: 'budget_estime', format: 'currency' },
  { header: 'Statut', key: 'statut' },
  { header: 'Source', key: 'source' },
  { header: 'Score qualification', key: 'score_qualification' },
  { header: 'Délai', key: 'delai' },
  { header: 'Description', key: 'description' },
  { header: 'Date création', key: 'created_at', format: 'datetime' },
];

export const devisExportColumns: ExportColumn<Record<string, unknown>>[] = [
  { header: 'Numéro', key: 'numero' },
  { header: 'Client', key: 'client_nom' },
  { header: 'Email client', key: 'client_email' },
  { header: 'Téléphone', key: 'client_telephone' },
  { header: 'Adresse', key: 'client_adresse' },
  { header: 'Montant HT', key: 'montant_ht', format: 'currency' },
  { header: 'TVA (%)', key: 'tva_pct', format: 'percent' },
  { header: 'Montant TTC', key: 'montant_ttc', format: 'currency' },
  { header: 'Statut', key: 'statut' },
  { header: 'Date création', key: 'date_creation', format: 'date' },
  { header: 'Date validité', key: 'date_validite', format: 'date' },
  { header: 'Date signature', key: 'date_signature', format: 'date' },
  { header: 'Notes', key: 'notes' },
];

export const chantiersExportColumns: ExportColumn<Record<string, unknown>>[] = [
  { header: 'Client', key: 'nom_client' },
  { header: 'Type de projet', key: 'type_projet' },
  { header: 'Adresse', key: 'adresse' },
  { header: 'Statut', key: 'statut' },
  { header: 'Avancement', key: 'avancement_pct', format: 'percent' },
  { header: 'Date début', key: 'date_debut', format: 'date' },
  { header: 'Date fin prévue', key: 'date_fin_prevue', format: 'date' },
  { header: 'Date fin réelle', key: 'date_fin_reelle', format: 'date' },
  { header: 'Notes', key: 'notes' },
  { header: 'Date création', key: 'created_at', format: 'datetime' },
];
