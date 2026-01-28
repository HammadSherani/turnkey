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
import { enUS } from "date-fns/locale";
import { 
  CalendarIcon, Search, Database, Plus, X, Lock, 
  ArrowUpCircle, Play, Save, Filter, Trash2, ChevronDown 
} from "lucide-react";
import { cn } from "@/lib/utils";
import ExtractionPreview from "./ExtractionPreview";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
}) {
  const [subject, setSubject] = useState("");
  const [sender, setSender] = useState("");
  const [startDate, setStartDate] = useState(undefined);
  const [endDate, setEndDate] = useState(undefined);
  
  const [extractionRules, setExtractionRules] = useState([
    { id: "1", extractType: "after", searchText: "", endType: "word" },
  ]);

  // Yup validation schema
  const schema = yup.object().shape({
    subject: yup.string().optional(),
    sender: yup.string().optional(), // Explicitly optional as requested
    startDate: yup.date().nullable().optional(),
    endDate: yup.date().nullable().optional(),
    extractionRules: yup
      .array()
      .of(
        yup.object().shape({
          extractType: yup.string().oneOf(["after", "before"]).required("Extract type is required"),
          searchText: yup.string().trim().required("Keyword is required"),
          endType: yup.string().oneOf(["word", "line", "paragraph"]).required("End type is required"),
        })
      )
      .min(1, "At least one extraction rule is required")
      .required(),
  });

  // Function to check if form is valid synchronously
  const isFormValid = () => {
    const formData = {
      subject,
      sender,
      startDate: startDate || null,
      endDate: endDate || null,
      extractionRules,
    };
    try {
      schema.validateSync(formData, { abortEarly: false });
      return true;
    } catch (error) {
      return false;
    }
  };

  const canAddMore = extractionRules.length < maxFieldsPerFilter;

  const addExtractionRule = () => {
    if (!canAddMore) return;
    const newRule = {
      id: Date.now().toString(),
      extractType: "after",
      searchText: "",
      endType: "word",
    };
    setExtractionRules([...extractionRules, newRule]);
  };

  const removeExtractionRule = (id) => {
    if (extractionRules.length <= 1) return;
    setExtractionRules(extractionRules.filter((rule) => rule.id !== id));
  };

  const updateExtractionRule = (id, field, value) => {
    setExtractionRules(
      extractionRules.map((rule) =>
        rule.id === id ? { ...rule, [field]: value } : rule
      )
    );
  };

  // --- Actions ---

  const handleSaveFilter = async () => {
    if (!canSaveFilter || !isFormValid()) return;
    const filterData = {
      subject,
      sender,
      startDate: startDate ? startDate.toISOString() : null,
      endDate: endDate ? endDate.toISOString() : null,
      extractionRules,
    };
    onSaveFilter(filterData);
  };

  const handleExtractClick = async () => {
    if (!isFormValid()) {
      // Optional: You can add error handling here, like showing a toast
      console.error("Form validation failed");
      return;
    }
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
    <div className="bg-card border border-border rounded-lg shadow-card h-full flex flex-col overflow-hidden">
      
      {savedFilters.length > 0 && (
        <div className="p-4 border-b border-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-accent" />
                  Saved Filters ({savedFilters.length})
                </span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[280px] bg-popover z-50" align="start">
              {savedFilters.map((filter) => (
                <DropdownMenuItem
                  key={filter.id}
                  className="flex items-center justify-between p-2 cursor-pointer focus:bg-accent/10"
                  onSelect={(e) => e.preventDefault()}
                >
                  <div className="flex-1 text-left" onClick={() => loadFilter(filter)}>
                    <div className="font-medium text-sm">{filter.name}</div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      {filter.data.extractionRules.length} extraction fields
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => onDeleteFilter(filter.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      <div className="p-4 border-b border-border bg-muted/20">
        <div className="flex items-center gap-2 text-accent">
          <Search className="h-5 w-5" />
          <h2 className="font-bold text-foreground">Email Search</h2>
        </div>
        <p className="text-[11px] text-muted-foreground mt-1">
          Set criteria to find specific emails in your inbox.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar">
        
        <div className="space-y-2">
          <Label htmlFor="subject" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Subject Keyword
          </Label>
          <Input
            id="subject"
            placeholder="e.g. Invoice, Receipt, Order"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="h-10 border-border focus-visible:ring-accent"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sender" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Sender Address
          </Label>
          <Input
            id="sender"
            placeholder="e.g. billing@amazon.com"
            value={sender}
            onChange={(e) => setSender(e.target.value)}
            className="h-10"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <CalendarIcon className="h-3 w-3" /> Date Range
          </Label>
          <div className="grid grid-cols-2 gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("h-10 justify-start text-xs", !startDate && "text-muted-foreground")}>
                  {startDate ? format(startDate, "MMM dd, yyyy") : "Start Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("h-10 justify-start text-xs", !endDate && "text-muted-foreground")}>
                  {endDate ? format(endDate, "MMM dd, yyyy") : "End Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="pt-4 border-t border-border">
          <div className="flex items-center gap-2 text-accent mb-4">
            <Database className="h-5 w-5" />
            <h2 className="font-bold text-foreground">Extract Data</h2>
          </div>

          <div className="space-y-4">
            {extractionRules.map((rule, index) => (
              <div key={rule.id} className="p-4 bg-accent/5 rounded-xl border border-accent/10 space-y-3 relative group shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="px-2 py-0.5 bg-accent text-white text-[10px] font-bold rounded uppercase">
                    Field {index + 1}
                  </div>
                  {extractionRules.length > 1 && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 rounded-full hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => removeExtractionRule(rule.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                
                <div className="grid gap-2">
                  <Select
                    value={rule.extractType}
                    onValueChange={(val) => updateExtractionRule(rule.id, "extractType", val)}
                  >
                    <SelectTrigger className="h-9 bg-background"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="after">Text After</SelectItem>
                      <SelectItem value="before">Text Before</SelectItem>
                    </SelectContent>
                  </Select>

                  <Input
                    placeholder="Keyword (e.g. Total:)"
                    value={rule.searchText}
                    onChange={(e) => updateExtractionRule(rule.id, "searchText", e.target.value)}
                    className="h-9 bg-background"
                  />

                  <Select
                    value={rule.endType}
                    onValueChange={(val) => updateExtractionRule(rule.id, "endType", val)}
                  >
                    <SelectTrigger className="h-9 bg-background"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="word">Stop at End of Word</SelectItem>
                      <SelectItem value="line">Stop at End of Line</SelectItem>
                      <SelectItem value="paragraph">Stop at New Paragraph</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <ExtractionPreview
                  extractType={rule.extractType}
                  endType={rule.endType}
                  searchText={rule.searchText}
                />
              </div>
            ))}

            <div className="pt-2">
              {canAddMore ? (
                <Button variant="outline" size="sm" className="w-full border-dashed border-accent/50 text-accent hover:bg-accent/5" onClick={addExtractionRule}>
                  <Plus className="h-4 w-4 mr-2" /> Add Field
                </Button>
              ) : (
                <div className="bg-muted/50 p-3 rounded-lg border border-border space-y-3 text-center">
                  <div className="text-[11px] text-muted-foreground flex items-center justify-center gap-2">
                    <Lock className="h-3 w-3" /> Max fields reached for {plan} plan
                  </div>
                  {nextPlanName && (
                    <Button variant="default" size="sm" className="w-full bg-accent hover:bg-accent/90">
                      <ArrowUpCircle className="h-4 w-4 mr-2" /> Upgrade to {nextPlanName}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-border bg-background space-y-3">
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-muted-foreground hover:text-accent"
          onClick={handleSaveFilter}
          disabled={!canSaveFilter || !isFormValid()}
        >
          <Save className="h-4 w-4 mr-2" /> Save this configuration
        </Button>

        <Button
          size="xl"
          variant="hero"
          className="w-full shadow-lg"
          onClick={handleExtractClick}
          disabled={isExtracting || !isFormValid()}
        >
          {isExtracting ? (
            <span className="flex items-center gap-2">
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Processing...
            </span>
          ) : (
            <>
              <Play className="h-5 w-5 mr-2" /> Run Extraction
            </>
          )}
        </Button>
      </div>
    </div>
  );
}