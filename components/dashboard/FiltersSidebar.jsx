"use client";

import { useState } from "react";
import * as yup from "yup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { 
  CalendarIcon, Search, Database, Plus, X, Lock, 
  ArrowUpCircle, Play, Save, Filter, Trash2, ChevronDown, 
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import ExtractionPreview from "./ExtractionPreview";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export default function FiltersSidebar({ 
  plan, 
  maxFieldsPerFilter,
  nextPlanName,
  onExtract, 
  isExtracting, 
  isQuotaReached,
  onSaveFilter,
  canSaveFilter,
  savedFiltersCount,
  maxFilters,
  savedFilters = [],
  onDeleteFilter,
  onLoadFilter,
  onUpgrade // Dashboard se pass kiya gaya function
}) {
  const [subject, setSubject] = useState("");
  const [sender, setSender] = useState("");
  const [startDate, setStartDate] = useState(undefined);
  const [endDate, setEndDate] = useState(undefined);
  
  const [extractionRules, setExtractionRules] = useState([
    { id: "1", extractType: "after", searchText: "", endType: "word" },
  ]);

  // Validation Schema
  const schema = yup.object().shape({
    subject: yup.string().optional(),
    sender: yup.string().optional(),
    startDate: yup.date().nullable().optional(),
    endDate: yup.date().nullable().optional(),
    extractionRules: yup
      .array()
      .of(
        yup.object().shape({
          extractType: yup.string().required(),
          searchText: yup.string().trim().required("Le mot-clé est requis"),
          endType: yup.string().required(),
        })
      )
      .min(1)
      .required(),
  });

  const isFormValid = () => {
    try {
      schema.validateSync({ subject, sender, startDate, endDate, extractionRules });
      return true;
    } catch (error) {
      return false;
    }
  };

  console.log("isQuotaReached", isQuotaReached);
  

  const canAddMore = extractionRules.length < maxFieldsPerFilter;

  const addExtractionRule = () => {
    if (!canAddMore) {
      toast.error(`Limite atteinte pour le plan ${plan}`);
      return;
    }
    setExtractionRules([...extractionRules, {
      id: Date.now().toString(),
      extractType: "after",
      searchText: "",
      endType: "word",
    }]);
  };

  const removeExtractionRule = (id) => {
    if (extractionRules.length <= 1) return;
    setExtractionRules(extractionRules.filter((rule) => rule.id !== id));
  };

  const updateExtractionRule = (id, field, value) => {
    setExtractionRules(prev => 
      prev.map((rule) => rule.id === id ? { ...rule, [field]: value } : rule)
    );
  };

  const handleSaveFilterClick = () => {
    if (!isFormValid()) {
      toast.error("Veuillez remplir les champs d'extraction.");
      return;
    }
    const filterData = {
      subject,
      sender,
      startDate: startDate ? startDate.toISOString() : null,
      endDate: endDate ? endDate.toISOString() : null,
      extractionRules,
    };
    onSaveFilter(filterData);
  };

  const handleExtractClick = () => {
    if (!isFormValid()) {
      toast.error("Veuillez configurer au moins un champ d'extraction.");
      return;
    }
    
    // Payload format according to backend expectations
    const payload = {
      subject,
      sender,
      startDate: startDate ? startDate.toISOString() : null,
      endDate: endDate ? endDate.toISOString() : null,
      extractionRules: extractionRules.map(rule => ({
        type: rule.extractType,
        keyword: rule.searchText,
        boundary: rule.endType
      }))
    };
    onExtract(payload);
  };

  const loadFilter = (filter) => {
    setSubject(filter.data.subject || "");
    setSender(filter.data.sender || "");
    setStartDate(filter.data.startDate ? new Date(filter.data.startDate) : undefined);
    setEndDate(filter.data.endDate ? new Date(filter.data.endDate) : undefined);
    setExtractionRules(filter.data.extractionRules || []);
    onLoadFilter(filter);
  };

  return (
    <div className="bg-card border border-border rounded-lg shadow-sm h-full flex flex-col overflow-hidden">
      
      {/* Saved Filters Dropdown */}
      {savedFilters.length > 0 && (
        <div className="p-4 border-b border-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-primary" />
                  Filtres enregistrés ({savedFilters.length})
                </span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[300px] z-50" align="start">
              {savedFilters.map((filter) => (
                <DropdownMenuItem key={filter.id} className="flex items-center justify-between p-2 focus:bg-accent/10" onSelect={(e) => e.preventDefault()}>
                  <div className="flex-1 cursor-pointer" onClick={() => loadFilter(filter)}>
                    <div className="font-medium text-sm">{filter.name}</div>
                    <div className="text-[10px] text-muted-foreground uppercase">
                      {filter.data.extractionRules.length} champs configurés
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => onDeleteFilter(filter.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Header */}
      <div className="p-4 border-b border-border bg-muted/20">
        <div className="flex items-center gap-2 text-primary">
          <Search className="h-5 w-5" />
          <h2 className="font-bold text-foreground">Recherche d'E-mails</h2>
        </div>
        <p className="text-[11px] text-muted-foreground mt-1">
          Définissez vos critères pour trouver les e-mails à traiter.
        </p>
      </div>

      {/* Form Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar">
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sujet contient</Label>
          <Input placeholder="ex: Facture, Commande..." value={subject} onChange={(e) => setSubject(e.target.value)} className="h-10" />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Expéditeur</Label>
          <Input placeholder="ex: billing@amazon.fr" value={sender} onChange={(e) => setSender(e.target.value)} className="h-10" />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <CalendarIcon className="h-3 w-3" /> Période
          </Label>
          <div className="grid grid-cols-2 gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("h-10 justify-start text-xs", !startDate && "text-muted-foreground")}>
                  {startDate ? format(startDate, "dd MMM yyyy") : "Début"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={startDate} onSelect={setStartDate} />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("h-10 justify-start text-xs", !endDate && "text-muted-foreground")}>
                  {endDate ? format(endDate, "dd MMM yyyy") : "Fin"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={endDate} onSelect={setEndDate} />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Extraction Rules */}
        <div className="pt-4 border-t border-border">
          <div className="flex items-center gap-2 text-primary mb-4">
            <Database className="h-5 w-5" />
            <h2 className="font-bold text-foreground">Données à Extraire</h2>
          </div>

          <div className="space-y-4">
            {extractionRules.map((rule, index) => (
              <div key={rule.id} className="p-4 bg-primary/5 rounded-xl border border-primary/10 space-y-3 relative shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="px-2 py-0.5 bg-primary text-white text-[10px] font-bold rounded uppercase">
                    Champ {index + 1}
                  </div>
                  {extractionRules.length > 1 && (
                    <Button size="icon" variant="ghost" className="h-6 w-6 rounded-full hover:text-destructive" onClick={() => removeExtractionRule(rule.id)}>
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                
                <div className="grid gap-2">
                  <Select value={rule.extractType} onValueChange={(val) => updateExtractionRule(rule.id, "extractType", val)}>
                    <SelectTrigger className="h-9 bg-background"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="after">Texte après</SelectItem>
                      <SelectItem value="before">Texte avant</SelectItem>
                    </SelectContent>
                  </Select>

                  <Input placeholder="Mot-clé (ex: Total:)" value={rule.searchText} onChange={(e) => updateExtractionRule(rule.id, "searchText", e.target.value)} className="h-9 bg-background" />

                  <Select value={rule.endType} onValueChange={(val) => updateExtractionRule(rule.id, "endType", val)}>
                    <SelectTrigger className="h-9 bg-background"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="word">Jusqu'à la fin du mot</SelectItem>
                      <SelectItem value="line">Jusqu'à la fin de la ligne</SelectItem>
                      <SelectItem value="paragraph">Jusqu'au paragraphe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <ExtractionPreview extractType={rule.extractType} endType={rule.endType} searchText={rule.searchText} />
              </div>
            ))}

            <div className="pt-2">
              {canAddMore ? (
                <Button variant="outline" size="sm" className="w-full border-dashed border-primary/50 text-primary hover:bg-primary/5" onClick={addExtractionRule}>
                  <Plus className="h-4 w-4 mr-2" /> Ajouter un champ
                </Button>
              ) : (
                <div className="bg-muted/50 p-3 rounded-lg border border-border space-y-3 text-center">
                  <div className="text-[11px] text-muted-foreground flex items-center justify-center gap-2">
                    <Lock className="h-3 w-3" /> Limite atteinte pour le plan {plan}
                  </div>
                  {nextPlanName && (
                    <Button variant="default" size="sm" className="w-full bg-primary" onClick={onUpgrade}>
                      <ArrowUpCircle className="h-4 w-4 mr-2" /> Passer au plan {nextPlanName}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-border bg-background space-y-3">
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-muted-foreground hover:text-primary"
          onClick={handleSaveFilterClick}
          disabled={!canSaveFilter || !isFormValid()}
        >
          <Save className="h-4 w-4 mr-2" /> Enregistrer ce filtre
        </Button>

        <Button
          size="lg"
          className="w-full shadow-lg bg-primary text-white hover:bg-primary/90"
          onClick={handleExtractClick}
          // disabled={isExtracting || isQuotaReached || !isFormValid()}
        >
          {isExtracting ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Extraction...
            </span>
          ) : (
            <>
              <Play className="h-5 w-5 mr-2" /> Lancer l'extraction
            </>
          )}
        </Button>
      </div>
    </div>
  );
}