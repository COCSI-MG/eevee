"use client";

import { useState, useCallback, useEffect } from "react";
import { Check, ChevronsUpDown, X, Loader2, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { NpmService, NpmPackage } from "@/app/services/npm.service";

interface PackageSearchInputProps {
  value: string[];
  onChange: (packages: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function PackageSearchInput({
  value = [],
  onChange,
  placeholder = "Search npm packages...",
  disabled = false,
}: PackageSearchInputProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<NpmPackage[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Debounced search
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const timeoutId = setTimeout(async () => {
      const results = await NpmService.searchPackages(searchQuery, 10);
      setSearchResults(results);
      setIsSearching(false);
    }, 300);

    return () => {
      clearTimeout(timeoutId);
      setIsSearching(false);
    };
  }, [searchQuery]);

  const handleSelect = useCallback(
    (packageName: string) => {
      if (!value.includes(packageName)) {
        onChange([...value, packageName]);
      }
      setSearchQuery("");
      setSearchResults([]);
    },
    [value, onChange]
  );

  const handleRemove = useCallback(
    (packageName: string) => {
      onChange(value.filter((pkg) => pkg !== packageName));
    },
    [value, onChange]
  );

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className="w-full justify-between bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
          >
            <span className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              {placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="bg-slate-800 border-slate-700">
          <Command className="bg-slate-800">
            <CommandInput
              placeholder="Type to search packages..."
              value={searchQuery}
              onValueChange={setSearchQuery}
              className="text-white"
            />
            <CommandList>
              {isSearching ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                  <span className="ml-2 text-sm text-slate-400">
                    Searching...
                  </span>
                </div>
              ) : searchResults.length === 0 && searchQuery.length >= 2 ? (
                <CommandEmpty className="text-slate-400">
                  No packages found.
                </CommandEmpty>
              ) : (
                <CommandGroup>
                  {searchResults.map((pkg) => (
                    <CommandItem
                      key={pkg.name}
                      value={pkg.name}
                      onSelect={() => handleSelect(pkg.name)}
                      className="text-white hover:bg-slate-700 cursor-pointer"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value.includes(pkg.name)
                            ? "opacity-100 text-green-500"
                            : "opacity-0"
                        )}
                      />
                      <div className="flex flex-col flex-1 overflow-hidden">
                        <div className="flex items-center gap-2">
                          <Package className="w-3 h-3 text-slate-400" />
                          <span className="font-medium">{pkg.name}</span>
                          <span className="text-xs text-slate-400">
                            v{pkg.version}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400 truncate">
                          {pkg.description}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected Packages as Chips */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 bg-slate-700/50 rounded-md border border-slate-600">
          {value.map((packageName) => (
            <Badge
              key={packageName}
              variant="secondary"
              className="bg-blue-600 text-white hover:bg-blue-700 pr-1"
            >
              <Package className="w-3 h-3 mr-1" />
              {packageName}
              <button
                type="button"
                onClick={() => handleRemove(packageName)}
                disabled={disabled}
                className="ml-1 rounded-full hover:bg-blue-800 p-0.5 disabled:opacity-50"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
