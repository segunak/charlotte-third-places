import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

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
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Reset search when modal opens/closes
  useEffect(() => {
    if (open) {
      setSearch("");
      // We don't auto-focus - this prevents the keyboard from appearing automatically
    }
  }, [open]);
  
  const filteredOptions = useMemo(() => {
    if (!search) return options;
    return options.filter((opt) => opt.toLowerCase().includes(search.toLowerCase()));
  }, [options, search]);

  // Handle selection with proper event handling
  const handleSelect = useCallback((selectedValue: string, e: React.MouseEvent) => {
    // Stop event propagation to prevent it from reaching elements behind the modal
    e.stopPropagation();
    onSelect(selectedValue);
    onOpenChange(false);
  }, [onSelect, onOpenChange]);

  // Prevent clicks from propagating through the modal
  const preventPropagation = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md rounded-lg bg-background p-6 pt-4 w-full max-w-full overflow-hidden"
        style={{ maxHeight: '90vh', zIndex: 100 }}
        onClick={preventPropagation}
        onOpenAutoFocus={(e) => {
          // This prevents automatic focus when the dialog opens
          // which is important to avoid triggering the keyboard on mobile
          e.preventDefault();
        }}
        onPointerDownOutside={(e) => {
          // Prevent clicks outside from triggering things behind the modal
          e.preventDefault();
        }}
        onInteractOutside={(e) => {
          // Stop interactions outside the modal from affecting elements behind
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <DialogTitle className="text-center w-full mb-2">Select {label}</DialogTitle>
        <Input
          ref={inputRef}
          placeholder={`Search ${label}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-3 w-full"
          onClick={preventPropagation}
          // Important: don't auto-focus to prevent keyboard pop-up on mobile
          autoFocus={false}
        />
        <ScrollArea 
          className="h-64 max-h-[55vh] w-full rounded-md border bg-background"
          onClick={preventPropagation}
        >
          <ul className="space-y-1" onClick={preventPropagation}>
            <li>
              <Button
                variant={value === "all" ? "default" : "ghost"}
                className="w-full justify-start mb-1"
                onClick={(e) => handleSelect("all", e)}
              >
                All
              </Button>
            </li>
            {filteredOptions.map((opt) => (
              <li key={opt}>
                <Button
                  variant={value === opt ? "default" : "ghost"}
                  className="w-full justify-start mb-1"
                  onClick={(e) => handleSelect(opt, e)}
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
