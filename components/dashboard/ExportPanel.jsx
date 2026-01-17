import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, CheckCircle, Lock } from "lucide-react";



export default function ExportPanel({
  hasExtracted,
  rowCount,
  onDownload,
}) {
  return (
    <div className="bg-card border border-border rounded-lg shadow-card h-full">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Download className="h-5 w-5 text-accent" />
          <h2 className="font-semibold text-foreground">Excel Export</h2>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Excel Icon */}
        <div className="flex justify-center py-4">
          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-all ${
            hasExtracted 
              ? "bg-success/10 text-success" 
              : "bg-secondary text-muted-foreground"
          }`}>
            <FileSpreadsheet className="h-10 w-10" />
          </div>
        </div>

        {/* Status */}
        {hasExtracted ? (
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-success">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Extraction complete</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {rowCount} rows ready to download
            </p>
          </div>
        ) : (
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Lock className="h-5 w-5" />
              <span className="font-medium">Waiting for extraction</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Run an extraction to generate the file
            </p>
          </div>
        )}

        {/* Download button */}
        <Button
          className="w-full"
          size="lg"
          variant={hasExtracted ? "default" : "secondary"}
          disabled={!hasExtracted}
          onClick={onDownload}
        >
          <Download className="h-4 w-4 mr-2" />
          Download Excel File
        </Button>

        {/* Info */}
        <p className="text-xs text-muted-foreground text-center">
          {hasExtracted
            ? "The file contains all extracted data."
            : "The button will be enabled after extraction."}
        </p>
      </div>
    </div>
  );
}
