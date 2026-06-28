import { useState } from "react";
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
import { DISTRICTS_BY_PROVINCE } from "@/data/districts";

interface DistrictSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function DistrictSelect({
  value,
  onChange,
  placeholder = "Select district…",
}: DistrictSelectProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {value || placeholder}
          <ChevronsUpDown size={14} className="ml-2 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search district…" />
          <CommandList>
            <CommandEmpty>No district found.</CommandEmpty>
            {Object.entries(DISTRICTS_BY_PROVINCE).map(([province, names]) => (
              <CommandGroup key={province} heading={province}>
                {names.map((name) => (
                  <CommandItem
                    key={name}
                    value={name}
                    onSelect={(selected) => {
                      onChange(selected === value ? "" : selected);
                      setOpen(false);
                    }}
                  >
                    <Check
                      size={14}
                      className={cn("mr-2", value === name ? "opacity-100" : "opacity-0")}
                    />
                    {name}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
