import { useState, useMemo, useEffect, useCallback } from "react";
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
  placeholder: string;
  onSelect: (value: string) => void;
}

export function SearchablePickerModal({
  open,
  onOpenChange,
  options,
  value,
  label,
  placeholder,
  onSelect,
}: SearchablePickerModalProps) {
  const [search, setSearch] = useState("");
  
  useEffect(() => {
    if (open) {
      setSearch("");
    }
  }, [open]);
  
  const filteredOptions = useMemo(() => {
    if (!search) return options;
    return options.filter((opt) => opt.toLowerCase().includes(search.toLowerCase()));
  }, [options, search]);

  const handleSelect = useCallback((selectedValue: string) => {
    onSelect(selectedValue);
    onOpenChange(false);
  }, [onSelect, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md rounded-lg bg-background p-6 pt-4 w-full max-w-full overflow-hidden"
        style={{ maxHeight: '90vh' }}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogTitle className="text-center w-full mb-2">Select {label}</DialogTitle>
        <Input
          placeholder={`Search ${label}...`}
          value={search}
          tabIndex={-1}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-3 w-full"
        />
        <ScrollArea className="h-64 max-h-[55vh] w-full rounded-md border bg-background">
          <ul className="space-y-1">
            <li>
              <Button
                variant={value === "all" ? "default" : "ghost"}
                className="w-full justify-start mb-1"
                onClick={() => handleSelect("all")}
              >
                All
              </Button>
            </li>
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
