"use client";
import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

function formatDate(date: Date | undefined) {
  if (!date) return "";

  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function isValidDate(date: Date | undefined) {
  if (!date) return false;
  return !isNaN(date.getTime());
}

export default function DatePickerField({
  label = "Select Date",
  value,
  onChange,
}: {
  label?: string;
  value?: Date | undefined;
  onChange?: (d: Date | undefined) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [date, setDate] = React.useState<Date | undefined>(value);
  const [month, setMonth] = React.useState<Date | undefined>(value);
  const [stringValue, setStringValue] = React.useState(formatDate(value));

  return (
    <div className="flex flex-col gap-3 w-full">
      <Label htmlFor="date">{label}</Label>

      <div className="relative flex gap-2">
        <Input
          id="date"
          value={stringValue}
          placeholder="June 01, 2025"
          className="bg-background pr-10"
          onChange={(e) => {
            const dateInput = new Date(e.target.value);
            setStringValue(e.target.value);
            if (isValidDate(dateInput)) {
              setDate(dateInput);
              setMonth(dateInput);
              onChange?.(dateInput);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
            }
          }}
        />

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              className="absolute top-1/2 right-2 size-6 -translate-y-1/2"
            >
              <CalendarIcon className="size-3.5" />
            </Button>
          </PopoverTrigger>

          <PopoverContent
            className="w-auto overflow-hidden p-0"
            align="end"
            alignOffset={-8}
            sideOffset={10}
          >
            <Calendar
              mode="single"
              selected={date}
              captionLayout="dropdown"
              month={month}
              onMonthChange={setMonth}
              onSelect={(selected) => {
                setDate(selected);
                setStringValue(formatDate(selected));
                onChange?.(selected);
                setOpen(false);
              }}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
