import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/Icons";

interface SearchablePickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  options: string[];
  value: string;
  label: string;
  placeholder?: string;
  onSelect: (value: string) => void;
  /** Hide the search input (default: true) */
  showSearch?: boolean;
  /** Hide the "Don't Filter By" default option (default: true) */
  showDefaultOption?: boolean;
  /** Custom title (default: "Select {label}") */
  title?: string;
  /** Map display option to a key value on select (default: identity) */
  optionKey?: (option: string) => string;
}

export function SearchablePickerModal({
  open,
  onOpenChange,
  options,
  value,
  label,
  placeholder,
  onSelect,
  showSearch = true,
  showDefaultOption = true,
  title,
  optionKey,
}: SearchablePickerModalProps) {
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setSearch("");
    }
  }, [open]);

  const filteredOptions = useMemo(() => {
    if (!search || !showSearch) return options;
    return options.filter((opt) => opt.toLowerCase().includes(search.toLowerCase()));
  }, [options, search, showSearch]);

  const handleSelect = useCallback((selectedValue: string) => {
    // If optionKey is provided, map the display value to the key
    const keyValue = optionKey ? optionKey(selectedValue) : selectedValue;
    onSelect(keyValue);
    onOpenChange(false);
  }, [onSelect, onOpenChange, optionKey]);

  const modalTitle = title ?? `Select ${label}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md rounded-lg bg-background p-6 pt-4 w-full max-w-full overflow-hidden"
        style={{ maxHeight: '100vh' }}
        onOpenAutoFocus={(e) => e.preventDefault()}
        crossCloseIconSize="h-6 w-6"
        data-filter-context
      >
        <DialogTitle className="text-center w-full mb-2">{modalTitle}</DialogTitle>
        {showSearch && (
          <div className="relative mb-3">
            <Icons.search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary pointer-events-none" />
            <Input
              ref={inputRef}
              value={search}
              autoFocus={false}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10"
            />
          </div>
        )}
        <ScrollArea className="max-h-[50dvh] w-full rounded-md border bg-background [&>div>div]:!scrollbar-none">
          <ul className="space-y-1">
            {showDefaultOption && (
              <li>
                <Button
                  variant={value === "all" ? "default" : "ghost"}
                  className="w-full justify-start mb-1"
                  onClick={() => handleSelect("all")}
                >
                  Don't Filter By {label}
                </Button>
              </li>
            )}
            {filteredOptions.map((opt) => (
              <li key={opt}>
                <Button
                  variant={value === opt ? "default" : "ghost"}
                  className="w-full justify-start mb-1"
                  onClick={() => handleSelect(opt)}
                >
                  {opt}
                </Button>
              </li>
            ))}
            {filteredOptions.length === 0 && (
              <li className="text-muted-foreground text-center py-4">No results</li>
            )}
          </ul>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}