import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileSpreadsheet, Loader2 } from "lucide-react";



const placeholderData = [
  {
    id: "1",
    sender: "factures@fournisseur.com",
    subject: "Facture N°2024-001",
    date: "15/01/2024",
    amount: "1 250,00 €",
    reference: "FAC-2024-001",
  },
  {
    id: "2",
    sender: "commandes@boutique.fr",
    subject: "Confirmation commande #45678",
    date: "14/01/2024",
    amount: "89,99 €",
    reference: "CMD-45678",
  },
  {
    id: "3",
    sender: "notifications@banque.com",
    subject: "Relevé mensuel Décembre",
    date: "10/01/2024",
    amount: "3 456,78 €",
    reference: "REL-DEC-2024",
  },
  {
    id: "4",
    sender: "support@service.io",
    subject: "Renouvellement abonnement",
    date: "08/01/2024",
    amount: "49,00 €",
    reference: "ABO-RENEW-789",
  },
  {
    id: "5",
    sender: "rh@entreprise.com",
    subject: "Bulletin de paie Janvier",
    date: "05/01/2024",
    amount: "2 850,00 €",
    reference: "PAY-2024-01",
  },
];

export default function ExcelPreview({
  data,
  isLoading,
  hasExtracted,
}) {
  const displayData = hasExtracted ? (data.length > 0 ? data : placeholderData) : [];

  return (
    <div className="bg-card border border-border rounded-lg shadow-card h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 text-accent" />
          <h2 className="font-semibold text-foreground">Aperçu des données extraites</h2>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full py-12">
            <Loader2 className="h-10 w-10 text-accent animate-spin mb-4" />
            <p className="text-muted-foreground">Extraction en cours...</p>
          </div>
        ) : !hasExtracted ? (
          <div className="flex flex-col items-center justify-center h-full py-12">
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4">
              <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-center">
              Lancez une extraction pour voir l'aperçu des données
            </p>
          </div>
        ) : (
          <div className="p-2">
            <div className="border border-border rounded-md overflow-hidden bg-background">
              {/* Excel-like header row */}
              <div className="bg-primary/5 border-b border-border px-3 py-1.5 flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-destructive/70" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/70" />
                  <div className="w-3 h-3 rounded-full bg-success/70" />
                </div>
                <span className="text-xs text-muted-foreground ml-2">extraction_inbox2excel.xlsx</span>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow className="bg-secondary/50 hover:bg-secondary/50">
                    <TableHead className="font-semibold text-xs w-8 text-center">#</TableHead>
                    <TableHead className="font-semibold text-xs">Expéditeur</TableHead>
                    <TableHead className="font-semibold text-xs">Objet</TableHead>
                    <TableHead className="font-semibold text-xs">Date</TableHead>
                    <TableHead className="font-semibold text-xs">Montant</TableHead>
                    <TableHead className="font-semibold text-xs">Référence</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayData.map((row, index) => (
                    <TableRow key={row.id} className="hover:bg-accent/5">
                      <TableCell className="text-xs text-muted-foreground text-center font-mono">
                        {index + 1}
                      </TableCell>
                      <TableCell className="text-xs font-medium">{row.sender}</TableCell>
                      <TableCell className="text-xs">{row.subject}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{row.date}</TableCell>
                      <TableCell className="text-xs font-medium text-accent">
                        {row.amount || "-"}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {row.reference || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {/* Excel-like footer */}
              <div className="bg-secondary/30 border-t border-border px-3 py-1.5 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {displayData.length} lignes extraites
                </span>
                <span className="text-xs text-muted-foreground">
                  6 colonnes
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
