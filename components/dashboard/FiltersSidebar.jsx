import { useState } from "react";
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
import { CalendarIcon, Search, Database, Plus, X, Lock, ArrowUpCircle, Play, Save, Filter, Trash2, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import ExtractionPreview from "./ExtractionPreview";
import { PlanType, SavedFilter, SavedFilterData, ExtractionRule } from "@/hooks/useSubscriptionQuotas";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
  savedFilters,
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

  const canAddMore = extractionRules.length < maxFieldsPerFilter;

  const addExtractionRule = () => {
    if (!canAddMore) return;
    const newRule= {
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

  const handleSaveFilter = () => {
    const filterData = {
      subject,
      sender,
      startDate,
      endDate,
      extractionRules,
    };
    onSaveFilter(filterData);
  };

  const loadFilter = (filter) => {
    setSubject(filter.data.subject);
    setSender(filter.data.sender);
    setStartDate(filter.data.startDate);
    setEndDate(filter.data.endDate);
    setExtractionRules(filter.data.extractionRules);
    onLoadFilter(filter);
  };

  return (
    <div className="bg-card border border-border rounded-lg shadow-card h-full flex flex-col">
      {/* Saved Filters Section */}
      {savedFilters.length > 0 && (
        <div className="p-4 border-b border-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Saved Filters ({savedFilters.length})
                </span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[280px] bg-popover z-50" align="start">
              {savedFilters.map((filter) => (
                <DropdownMenuItem
                  key={filter.id}
                  className="flex items-center justify-between p-3 cursor-pointer"
                  onSelect={(e) => e.preventDefault()}
                >
                  <button
                    className="flex-1 text-left"
                    onClick={() => loadFilter(filter)}
                  >
                    <div className="font-medium text-sm">{filter.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {filter.data.extractionRules.length} rule(s)
                    </div>
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteFilter(filter.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Email Search Section */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Search className="h-5 w-5 text-accent" />
          <h2 className="font-semibold text-foreground">Email Search</h2>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Define the email selection criteria
        </p>
      </div>

      <div className="p-4 space-y-4 overflow-y-auto flex-1">
        {/* Subject */}
        <div className="space-y-1.5">
          <Label htmlFor="subject" className="text-sm font-medium">
            Subject
          </Label>
          <Input
            id="subject"
            placeholder="Keyword in the email subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="h-9"
          />
        </div>

        {/* Sender */}
        <div className="space-y-1.5">
          <Label htmlFor="sender" className="text-sm font-medium">
            Sender <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <Input
            id="sender"
            placeholder="Email address or domain (e.g., @company.com)"
            value={sender}
            onChange={(e) => setSender(e.target.value)}
            className="h-9"
          />
          <p className="text-xs text-muted-foreground">
            If empty, emails from multiple senders will be included automatically.
          </p>
        </div>

        {/* Date Range */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium flex items-center gap-1.5">
            <CalendarIcon className="h-4 w-4" />
            Date Range
          </Label>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full h-9 justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "MM/dd/yyyy", { locale: enUS }) : "Start"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-popover" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full h-9 justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "MM/dd/yyyy", { locale: enUS }) : "End"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-popover" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </div>

      {/* Extract Data Section */}
      <div className="border-t border-border">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-accent" />
            <h2 className="font-semibold text-foreground">Extract Data</h2>
          </div>
        </div>

        <div className="p-4 space-y-3 overflow-y-auto max-h-[300px]">
          {extractionRules.map((rule, index) => (
            <div
              key={rule.id}
              className="p-3 bg-secondary/30 rounded-lg border border-border space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Field {index + 1}
                </span>
                {extractionRules.length > 1 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removeExtractionRule(rule.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              <div className="space-y-2">
                <Select
                  value={rule.extractType}
                  onValueChange={(value) => updateExtractionRule(rule.id, "extractType", value)}
                >
                  <SelectTrigger className="h-9 bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="after">Text after</SelectItem>
                    <SelectItem value="before">Text before</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  placeholder="E.g., Invoice number:"
                  value={rule.searchText}
                  onChange={(e) => updateExtractionRule(rule.id, "searchText", e.target.value)}
                  className="h-9"
                />

                <Select
                  value={rule.endType}
                  onValueChange={(value) => updateExtractionRule(rule.id, "endType", value)}
                >
                  <SelectTrigger className="h-9 bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="word">End of word</SelectItem>
                    <SelectItem value="line">End of line</SelectItem>
                    <SelectItem value="paragraph">End of paragraph</SelectItem>
                  </SelectContent>
                </Select>

                {/* Dynamic visual aid */}
                <ExtractionPreview
                  extractType={rule.extractType}
                  endType={rule.endType}
                  searchText={rule.searchText}
                />
              </div>
            </div>
          ))}

          {/* Add Button */}
          <div className="pt-2">
            {canAddMore ? (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={addExtractionRule}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add a field
              </Button>
            ) : (
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full opacity-50 cursor-not-allowed"
                  disabled
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Your subscription allows up to {maxFieldsPerFilter} fields per filter
                </Button>
                {nextPlanName && (
                  <Button
                    variant="default"
                    size="sm"
                    className="w-full bg-accent hover:bg-accent/90"
                  >
                    <ArrowUpCircle className="h-4 w-4 mr-2" />
                    Upgrade to {nextPlanName}
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Limit indicator */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border">
            <span>Extraction fields</span>
            <span className="font-medium">
              {extractionRules.length} / {maxFieldsPerFilter}
              {/* <span className="ml-1 text-accent">({planNames[plan]})</span> */}
            </span>
          </div>
        </div>
      </div>

      {/* Actions: Save and Extract */}
      <div className="p-4 border-t border-border space-y-3">
        {/* Save Filter Button */}
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={handleSaveFilter}
        >
          <Save className="h-4 w-4 mr-2" />
          Save Filter
        </Button>

        {/* Extract Button */}
        <Button
          size="xl"
          variant="hero"
          className="w-full animate-pulse-glow"
          onClick={onExtract}
          disabled={isExtracting || isQuotaReached}
        >
          <Play className="h-5 w-5 mr-2" />
          {isExtracting ? "Extracting..." : isQuotaReached ? "Quota reached" : "Extract"}
        </Button>
      </div>

    </div>
  );
}
