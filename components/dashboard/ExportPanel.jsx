import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, CheckCircle, Lock, Table as TableIcon } from "lucide-react";
import * as XLSX from 'xlsx';

export default function ExportPanel({
  hasExtracted,
  rowCount,
  extractedData = [],
}) {

  console.log("extractedData", extractedData);
  

  const runDownload = () => {
    if (extractedData.length === 0) return;

    const worksheetData = extractedData.map(item => ({
      "Subject": item.subject,
      "Sender": item.sender || "N/A",
      "Date": new Date(item.date)?.toLocaleString(),
      ...item.extractedData 
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Results");
    XLSX.writeFile(workbook, `Outlook_Extraction_${new Date().getTime()}.xlsx`);
  };

  // Dynamic headers logic
  const getHeaders = () => {
    if (extractedData.length === 0) return [];
    // Hum "extractedData" object ki saari keys nikaal rahe hain (field_1, field_2 etc)
    const firstRowFields = Object.keys(extractedData[0].extractedData || {});
    return ["Subject", "Date", ...firstRowFields];
  };

  const headers = getHeaders();

  return (
    <div className="bg-card border border-border rounded-lg shadow-card h-full flex flex-col overflow-hidden">
      {/* Header Section */}
      <div className="p-4 border-b border-border bg-muted/10">
        <div className="flex items-center gap-2">
          <Download className="h-5 w-5 text-accent" />
          <h2 className="font-semibold text-foreground">Export Excel</h2>
        </div>
      </div>

      {/* Status & Download Button */}
      <div className="p-4 space-y-4 flex-shrink-0">
        {hasExtracted ? (
          <div className="flex items-center justify-between bg-green-500/5 p-3 rounded-xl border border-green-500/20 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="bg-green-500 text-white p-2 rounded-lg">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="text-[10px] text-muted-foreground uppercase font-black">
                  Extraction réussie
                </p>
                <p className="text-lg font-bold leading-none">
                  {rowCount} enregistrements prêts
                </p>
              </div>
            </div>
            <CheckCircle className="h-6 w-6 text-green-500" />
          </div>
        ) : (
          <div className="text-center py-6 border-2 border-dashed border-border rounded-xl">
            <Lock className="h-6 w-6 text-muted-foreground/20 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">
              En attente du processus d’extraction…
            </p>
          </div>
        )}

        <Button
          className={`w-full h-12 text-md font-bold transition-all duration-300 ${
            hasExtracted ? "bg-green-600 hover:bg-green-700 shadow-lg shadow-green-900/20" : ""
          }`}
          disabled={!hasExtracted || rowCount === 0}
          onClick={runDownload}
        >
          <Download className="h-5 w-5 mr-2" />
          Télécharger le fichier Excel
        </Button>
      </div>

      {/* Dynamic Data Table Preview */}
      <div className="flex-1 flex flex-col min-h-0 border-t border-border">
        <div className="px-4 py-2 bg-muted/30 flex items-center justify-between border-b border-border">
          <div className="flex items-center gap-2">
            <TableIcon className="h-3.5 w-3.5 text-accent" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Aperçu des données
            </span>
          </div>
          <span className="text-[9px] bg-accent/10 text-accent px-2 py-0.5 rounded-full font-bold">
            EN DIRECT
          </span>
        </div>

        {/* Horizontal & Vertical Scrollable Area */}
        <div className="flex-1 overflow-auto bg-background custom-scrollbar">
          {hasExtracted && extractedData.length > 0 ? (
            <table className="w-full text-left border-collapse table-fixed">
              <thead className="sticky top-0 bg-background/95 backdrop-blur-sm z-20">
                <tr>
                  {headers.map((header) => (
                    <th
                      key={header}
                      className="px-4 py-3 text-[10px] font-black border-b border-border uppercase tracking-wider text-muted-foreground bg-muted/20 w-[150px]"
                    >
                      {header.replace("field_", "Champ ")}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {extractedData.map((row, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-accent/5 transition-colors group">
                    {/* Standard Fields */}
                    <td className="px-4 py-3 text-[11px] font-medium truncate group-hover:text-foreground">
                      {row.subject}
                    </td>
                    <td className="px-4 py-3 text-[11px] text-muted-foreground whitespace-nowrap">
                      {new Date(row.date).toLocaleDateString()}
                    </td>
                    
                    {/* Dynamic Custom Fields Mapping */}
                    {Object.entries(row.extractedData).map(([key, val], cellIndex) => (
                      <td
                        key={cellIndex}
                        className="px-4 py-3 text-[11px] text-accent font-semibold"
                      >
                        <div className="max-h-[40px] overflow-y-auto overflow-x-hidden leading-tight custom-scrollbar">
                          {val}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground/30 space-y-2">
              <TableIcon className="h-10 w-10 stroke-[1px]" />
              <p className="italic text-xs">
                Aucune donnée disponible pour l’aperçu
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
