"use client";
import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
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

interface OptionType {
  label: string;
  value: string;
}

interface ComboboxProps {
  label?: string;
  placeholder?: string;
  options: OptionType[];
  value: string;
  onChange: (value: string) => void;
  width?: string;
}

export function SelectBox({
  label = "",
  placeholder = "Select option...",
  options = [],
  value = "",
  onChange,
  width = "100%",
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (selectedValue: string) => {
    const newValue = value === selectedValue ? "" : selectedValue;
    onChange(newValue);
    setOpen(false);
  };

  const widthClass =
    width === "100%"
      ? "w-full"
      : width.endsWith("px")
        ? `w-[${width}]`
        : width.endsWith("%")
          ? `w-[${width}]`
          : "w-full";

  return (
    <div className="flex flex-col gap-2">
      {label && <label className="text-sm font-medium">{label}</label>}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn("justify-between", widthClass)}
          >
            {value
              ? (options.find((opt) => opt.value === value)?.label ??
                placeholder)
              : placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className={cn("p-0", widthClass)}>
          <Command>
            <CommandInput placeholder="Search..." />
            <CommandList>
              <CommandEmpty>No option found.</CommandEmpty>
              <CommandGroup>
                {options.map((opt) => (
                  <CommandItem
                    key={opt.value}
                    value={opt.value}
                    onSelect={() => handleSelect(opt.value)}
                  >
                    {opt.label}
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        value === opt.value ? "opacity-100" : "opacity-0",
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
