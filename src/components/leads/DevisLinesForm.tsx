import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Trash2, Plus } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

export interface DevisLine {
    designation: string;
    quantite: number;
    unite: string;
    prix_unitaire_ht: number;
}

interface DevisLinesFormProps {
    value: DevisLine[];
    onChange: (lines: DevisLine[]) => void;
    notes?: string;
    onNotesChange?: (notes: string) => void;
}

export const DevisLinesForm = ({ value, onChange, notes, onNotesChange }: DevisLinesFormProps) => {
    const addLine = () => {
        onChange([
            ...value,
            {
                designation: '',
                quantite: 1,
                unite: 'unité',
                prix_unitaire_ht: 0,
            },
        ]);
    };

    const removeLine = (index: number) => {
        onChange(value.filter((_, i) => i !== index));
    };

    const updateLine = (index: number, field: keyof DevisLine, val: string | number) => {
        const newLines = [...value];
        newLines[index] = {
            ...newLines[index],
            [field]: val,
        };
        onChange(newLines);
    };

    const calculateTotal = (line: DevisLine) => {
        return (line.quantite * line.prix_unitaire_ht).toFixed(2);
    };

    const calculateGrandTotal = () => {
        return value.reduce((sum, line) => sum + line.quantite * line.prix_unitaire_ht, 0).toFixed(2);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">📋 Lignes de Devis Personnalisées</Label>
                <Button type="button" onClick={addLine} size="sm" variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter une ligne
                </Button>
            </div>

            {value.length === 0 ? (
                <Card className="p-6 text-center text-muted-foreground">
                    <p>Aucune ligne de devis. Cliquez sur "Ajouter une ligne" pour commencer.</p>
                    <p className="text-xs mt-2">
                        Si vous ne remplissez pas de lignes custom, le système utilisera le budget négocié ou l'IA.
                    </p>
                </Card>
            ) : (
                <div className="space-y-3">
                    {value.map((line, index) => (
                        <Card key={index} className="p-4">
                            <div className="grid grid-cols-12 gap-3 items-end">
                                <div className="col-span-5">
                                    <Label htmlFor={`designation-${index}`} className="text-xs">
                                        Désignation *
                                    </Label>
                                    <Input
                                        id={`designation-${index}`}
                                        value={line.designation}
                                        onChange={(e) => updateLine(index, 'designation', e.target.value)}
                                        placeholder="Ex: Excavation terrain"
                                        required
                                    />
                                </div>

                                <div className="col-span-2">
                                    <Label htmlFor={`quantite-${index}`} className="text-xs">
                                        Quantité *
                                    </Label>
                                    <Input
                                        id={`quantite-${index}`}
                                        type="number"
                                        step="0.01"
                                        value={line.quantite}
                                        onChange={(e) => updateLine(index, 'quantite', parseFloat(e.target.value) || 0)}
                                        required
                                    />
                                </div>

                                <div className="col-span-2">
                                    <Label htmlFor={`unite-${index}`} className="text-xs">
                                        Unité
                                    </Label>
                                    <Input
                                        id={`unite-${index}`}
                                        value={line.unite}
                                        onChange={(e) => updateLine(index, 'unite', e.target.value)}
                                        placeholder="m², u, forfait"
                                    />
                                </div>

                                <div className="col-span-2">
                                    <Label htmlFor={`prix-${index}`} className="text-xs">
                                        Prix Unit. HT *
                                    </Label>
                                    <Input
                                        id={`prix-${index}`}
                                        type="number"
                                        step="0.01"
                                        value={line.prix_unitaire_ht}
                                        onChange={(e) => updateLine(index, 'prix_unitaire_ht', parseFloat(e.target.value) || 0)}
                                        required
                                    />
                                </div>

                                <div className="col-span-1 flex items-center justify-between">
                                    <div className="text-sm font-semibold">{calculateTotal(line)}€</div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeLine(index)}
                                        className="text-destructive hover:text-destructive"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}

                    <div className="flex justify-end items-center gap-4 pt-2 border-t">
                        <span className="text-sm font-medium">Total HT:</span>
                        <span className="text-lg font-bold text-primary">{calculateGrandTotal()}€</span>
                    </div>
                </div>
            )}

            {onNotesChange && (
                <div className="space-y-2">
                    <Label htmlFor="notes_devis_custom">Notes additionnelles (optionnel)</Label>
                    <Textarea
                        id="notes_devis_custom"
                        value={notes || ''}
                        onChange={(e) => onNotesChange(e.target.value)}
                        placeholder="Ex: Devis établi après entretien téléphonique du [date]"
                        rows={2}
                    />
                </div>
            )}
        </div>
    );
};
