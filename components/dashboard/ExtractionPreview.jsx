import { useMemo } from "react";
import { cn } from "@/lib/utils";



export default function ExtractionPreview({ extractType, endType, searchText }) {
  const example = useMemo(() => {
    // If no search text is entered, don't show an example
    if (!searchText.trim()) return null;

    const displayText = searchText.trim();

    // CASE 1 — TEXT AFTER
    if (extractType === "after") {
      if (endType === "word") {
        return {
          lines: [
            { text: `${displayText} `, isHighlighted: false },
            { text: "249.99", isHighlighted: true },
            { text: " USD incl. tax", isHighlighted: false },
          ],
          extractedValue: "249.99",
        };
      } else if (endType === "line") {
        return {
          lines: [
            { text: `${displayText} `, isHighlighted: false },
            { text: "249.99 USD incl. tax", isHighlighted: true },
            { text: "\n", isHighlighted: false },
            { text: "Thank you for your order", isHighlighted: false },
          ],
          extractedValue: "249.99 USD incl. tax",
        };
      } else if (endType === "paragraph") {
        return {
          lines: [
            { text: `${displayText} `, isHighlighted: false },
            { text: "249.99 USD incl. tax\nThank you for your trust.", isHighlighted: true },
          ],
          extractedValue: "249.99 USD incl. tax\nThank you for your trust.",
        };
      }
    }
    
    // CASE 2 — TEXT BEFORE
    if (extractType === "before") {
      if (endType === "word") {
        return {
          lines: [
            { text: "Order reference: ", isHighlighted: false },
            { text: "45892", isHighlighted: true },
            { text: ` ${displayText}`, isHighlighted: false },
          ],
          extractedValue: "45892",
        };
      } else if (endType === "line") {
        return {
          lines: [
            { text: "Total amount: 249.99 USD incl. tax", isHighlighted: true },
            { text: ` ${displayText}`, isHighlighted: false },
            { text: "\n", isHighlighted: false },
            { text: "Thank you for your order", isHighlighted: false },
          ],
          extractedValue: "Total amount: 249.99 USD incl. tax",
        };
      } else if (endType === "paragraph") {
        return {
          lines: [
            { text: "249.99 USD incl. tax\nThank you for your order ", isHighlighted: true },
            { text: displayText, isHighlighted: false },
          ],
          extractedValue: "249.99 USD incl. tax\nThank you for your order",
        };
      }
    }

    return null;
  }, [extractType, endType, searchText]);

  if (!example) {
    return (
      <div className="mt-2 p-2.5 bg-muted/30 rounded-md border border-dashed border-border transition-all duration-300">
        <p className="text-xs text-muted-foreground text-center italic">
          The example will appear once you enter a word or value.
        </p>
      </div>
    );
  }

  // Render the example with proper line breaks
  const renderExample = () => {
    const elements = [];

    example.lines.forEach((segment, index) => {
      if (segment.text === "\n") {
        elements.push(<br key={`br-${index}`} />);
      } else if (segment.text === "\n\n") {
        elements.push(<br key={`br1-${index}`} />);
        elements.push(<br key={`br2-${index}`} />);
      } else if (segment.isHighlighted) {
        elements.push(
          <span
            key={`hl-${index}`}
            className={cn(
              "inline px-1 py-0.5 rounded font-semibold",
              "bg-success/20 text-success border border-success/30",
              "transition-all duration-300"
            )}
          >
            {segment.text}
          </span>
        );
      } else {
        elements.push(
          <span key={`txt-${index}`} className="text-foreground/80">
            {segment.text}
          </span>
        );
      }
    });

    return elements;
  };

  return (
    <div className="mt-2 space-y-2 transition-all duration-300">
      {/* Email Example */}
      <div className="p-2.5 bg-muted/50 rounded-md border border-border">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 font-medium">
          Email Example
        </p>
        <div className="font-mono text-xs leading-relaxed whitespace-pre-wrap">
          {renderExample()}
        </div>
      </div>

      {/* Legend with extracted value */}
      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <span className="text-success">➡️</span>
        <span>Extracted data:</span>
        <span className={cn(
          "ml-1 px-1.5 py-0.5 rounded text-[10px] font-medium",
          "bg-success/10 text-success border border-success/20",
          "transition-all duration-300"
        )}>
          {example.extractedValue}
        </span>
      </div>
    </div>
  );
}
