import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/Icons";
import { CheckIcon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";

// Base props shared between single and multi-select modes
interface BaseSearchablePickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  options: string[];
  label: string;
  placeholder?: string;
  /** Hide the search input (default: true) */
  showSearch?: boolean;
  /** Custom title (default: "Select {label}") */
  title?: string;
  /** Map display option to a key value on select (default: identity) */
  optionKey?: (option: string) => string;
}

// Single-select mode props
interface SingleSelectPickerProps extends BaseSearchablePickerModalProps {
  multiple?: false;
  value: string;
  onSelect: (value: string) => void;
  /** Hide the "All" default option (default: true) */
  showDefaultOption?: boolean;
}

// Multi-select mode props
interface MultiSelectPickerProps extends BaseSearchablePickerModalProps {
  multiple: true;
  value: string[];
  onSelect: (value: string[]) => void;
  showDefaultOption?: never;
  /** Current match mode for multi-select */
  matchMode?: 'and' | 'or';
  /** Callback when match mode changes */
  onMatchModeChange?: (mode: 'and' | 'or') => void;
}

type SearchablePickerModalProps = SingleSelectPickerProps | MultiSelectPickerProps;

export function SearchablePickerModal(props: SearchablePickerModalProps) {
  const {
    open,
    onOpenChange,
    options,
    label,
    placeholder,
    showSearch = true,
    title,
    optionKey,
    multiple = false,
  } = props;

  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Type guards
  const isMultiple = multiple === true;
  const singleValue = isMultiple ? "" : (props as SingleSelectPickerProps).value;
  const multiValue = isMultiple ? (props as MultiSelectPickerProps).value : [];
  const showDefaultOption = !isMultiple && ((props as SingleSelectPickerProps).showDefaultOption ?? true);
  const matchMode = isMultiple ? (props as MultiSelectPickerProps).matchMode : undefined;
  const onMatchModeChange = isMultiple ? (props as MultiSelectPickerProps).onMatchModeChange : undefined;

  // Match mode can be stored in context higher up; keep a local copy so the UI
  // reflects the click immediately (avoids "updates after mouse leaves" feel).
  const [localMatchMode, setLocalMatchMode] = useState<'and' | 'or'>(() => matchMode ?? 'and');

  useEffect(() => {
    if (!isMultiple) return;
    setLocalMatchMode(matchMode ?? 'and');
  }, [isMultiple, matchMode, open]);

  const handleMatchModeClick = useCallback((mode: 'and' | 'or') => {
    setLocalMatchMode(mode);
    onMatchModeChange?.(mode);
  }, [onMatchModeChange]);

  useEffect(() => {
    if (open) {
      setSearch("");
    }
  }, [open]);

  const filteredOptions = useMemo(() => {
    if (!search || !showSearch) return options;
    return options.filter((opt) => opt.toLowerCase().includes(search.toLowerCase()));
  }, [options, search, showSearch]);

  // Single-select: select and close
  const handleSingleSelect = useCallback((selectedValue: string) => {
    if (isMultiple) return;
    const keyValue = optionKey ? optionKey(selectedValue) : selectedValue;
    (props as SingleSelectPickerProps).onSelect(keyValue);
    onOpenChange(false);
  }, [isMultiple, optionKey, props, onOpenChange]);

  // Multi-select: toggle item
  const handleMultiToggle = useCallback((item: string) => {
    if (!isMultiple) return;
    const currentValue = (props as MultiSelectPickerProps).value;
    const keyValue = optionKey ? optionKey(item) : item;
    const newValue = currentValue.includes(keyValue)
      ? currentValue.filter(v => v !== keyValue)
      : [...currentValue, keyValue];
    (props as MultiSelectPickerProps).onSelect(newValue);
  }, [isMultiple, optionKey, props]);

  // Multi-select: clear all
  const handleClearAll = useCallback(() => {
    if (!isMultiple) return;
    (props as MultiSelectPickerProps).onSelect([]);
  }, [isMultiple, props]);

  // Multi-select: done button
  const handleDone = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const modalTitle = title ?? `Select ${label}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-lg rounded-lg bg-background p-0 w-full max-w-full overflow-hidden flex flex-col"
        style={{ maxHeight: '95vh' }}
        onOpenAutoFocus={(e) => e.preventDefault()}
        crossCloseIconSize="h-7 w-7"
      >
        {/* Header section */}
        <div className="px-6 pt-5 pb-4 border-b space-y-4">
          <DialogTitle className="text-lg font-semibold text-center">
            {modalTitle}
          </DialogTitle>
          
          {/* Multi-select match mode toggle */}
          {isMultiple && onMatchModeChange && (
            <div className="flex flex-col items-center gap-1.5">
              <div className="inline-flex rounded-lg border border-input bg-muted/30 p-0.5">
                <button
                  type="button"
                  onClick={() => handleMatchModeClick('and')}
                  aria-pressed={localMatchMode === 'and'}
                  className={cn(
                    "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                    localMatchMode === 'and'
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  Match All
                </button>
                <button
                  type="button"
                  onClick={() => handleMatchModeClick('or')}
                  aria-pressed={localMatchMode === 'or'}
                  className={cn(
                    "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                    localMatchMode === 'or'
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  Match Any
                </button>
              </div>
              <p className="text-sm text-muted-foreground">
                {localMatchMode === 'and' 
                  ? "Results must have every selected tag" 
                  : "Results can have any selected tag"}
              </p>
            </div>
          )}
          
          {/* Search input */}
          {showSearch && (
            <div className="relative">
              <Icons.search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                ref={inputRef}
                value={search}
                autoFocus={false}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full pl-10 bg-muted/30"
              />
            </div>
          )}
        </div>
        
        {/* Scrollable options list */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 px-2 py-2" style={{ maxHeight: '70vh' }}>
          <ul className={cn(
            isMultiple ? "grid grid-cols-2 gap-1" : "space-y-0.5"
          )}>
            {showDefaultOption && !isMultiple && (
              <li>
                <Button
                  variant={singleValue === "all" ? "default" : "ghost"}
                  className="w-full justify-start mb-1"
                  onClick={() => handleSingleSelect("all")}
                  data-selected={singleValue === "all" ? "" : undefined}
                >
                  All
                </Button>
              </li>
            )}
            {filteredOptions.map((opt) => {
              const keyValue = optionKey ? optionKey(opt) : opt;
              const isSelected = isMultiple
                ? multiValue.includes(keyValue)
                : singleValue === opt;

              if (isMultiple) {
                return (
                  <li key={opt}>
                    <button
                      type="button"
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg transition-colors",
                        "hover:bg-primary/10",
                        isSelected && "bg-primary/10"
                      )}
                      onClick={() => handleMultiToggle(opt)}
                    >
                      <span className={cn(
                        "flex h-5 w-5 items-center justify-center rounded border-2 shrink-0 transition-colors",
                        isSelected ? "bg-primary border-primary" : "border-muted-foreground/40"
                      )}>
                        {isSelected && <CheckIcon className="h-3.5 w-3.5 text-primary-foreground" />}
                      </span>
                      <span className="text-sm min-w-0 whitespace-normal wrap-break-word">{opt}</span>
                    </button>
                  </li>
                );
              }

              return (
                <li key={opt}>
                  <Button
                    variant={isSelected ? "default" : "ghost"}
                    className="w-full justify-start mb-1 min-w-0 whitespace-normal wrap-break-word text-left"
                    onClick={() => handleSingleSelect(opt)}
                    data-selected={isSelected ? "" : undefined}
                  >
                    {opt}
                  </Button>
                </li>
              );
            })}
            {filteredOptions.length === 0 && (
              <li className="text-muted-foreground text-center py-8">No results found</li>
            )}
          </ul>
        </div>
        
        {/* Footer with Clear and Done buttons */}
        {isMultiple && (
          <div className="px-6 py-4 border-t bg-muted/20 grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-11 text-base"
              onClick={handleClearAll}
              disabled={multiValue.length === 0}
            >
              Clear
            </Button>
            <Button
              variant="default"
              className="h-11 text-base"
              onClick={handleDone}
            >
              Done{multiValue.length > 0 ? ` (${multiValue.length})` : ""}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}