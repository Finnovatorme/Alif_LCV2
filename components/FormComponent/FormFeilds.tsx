"use client";

import { ControllerRenderProps } from "react-hook-form";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Check, ChevronsUpDown, Hash, Menu, Calendar as CalendarIcon } from "lucide-react";
import { parseDateFlexible, formatDateKSA } from "@/utils/helpers";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FieldConfig } from "@/types/field.types";
import { FormLabel } from "../ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command";
import { cn } from "@/lib/utils";
import { Calendar } from "../ui/calendar";

function DateField({
  config,
  field,
  errorClass,
  renderError,
}: {
  config: FieldConfig & { error?: string };
  field: ControllerRenderProps<any, string>;
  errorClass: string;
  renderError: () => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  const parsedDate = parseDateFlexible(field.value);
  const displayVal = parsedDate ? formatDateKSA(parsedDate) : (typeof field.value === "string" ? field.value : "");
  const [textValue, setTextValue] = useState(displayVal);

  useEffect(() => {
    const d = parseDateFlexible(field.value);
    setTextValue(d ? formatDateKSA(d) : (typeof field.value === "string" ? field.value : ""));
  }, [field.value]);

  const handleSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      const formatted = formatDateKSA(selectedDate);
      setTextValue(formatted);
      field.onChange(formatted);
      setOpen(false);
    } else {
      setTextValue("");
      field.onChange("");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTextValue(val);
    const parsed = parseDateFlexible(val);
    if (parsed) {
      field.onChange(formatDateKSA(parsed));
    } else {
      field.onChange(val);
    }
  };

  return (
    <>
      <FormLabel>
        {config.label}{" "}
        {config.required && <span className="text-red-500">*</span>}
      </FormLabel>

      <div className="relative flex items-center">
        <Input
          type="text"
          placeholder={config.placeholder || "dd/mm/yyyy"}
          value={textValue}
          onChange={handleInputChange}
          disabled={config.disabled}
          readOnly={config.readOnly}
          className={cn("pr-10", errorClass)}
        />

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={config.disabled || config.readOnly}
              className="absolute right-1 h-8 w-8 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              <CalendarIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={parsedDate}
              captionLayout="dropdown"
              defaultMonth={parsedDate || new Date()}
              onSelect={handleSelect}
            />
          </PopoverContent>
        </Popover>
      </div>

      {renderError()}
    </>
  );
}



export function FormFeilds(
  config: FieldConfig & { error?: string },
  field: ControllerRenderProps<any, string>,
): React.ReactElement {
  const errorClass = config.error
    ? "border-red-500 focus-visible:ring-red-500"
    : "";

  const renderError = () =>
    config.error ? (
      <p className="text-sm text-red-500 mt-1">{config.error}</p>
    ) : null;

  switch (config.type) {
    case "date":
      return (
        <DateField
          config={config}
          field={field}
          errorClass={errorClass}
          renderError={renderError}
        />
      );

    case "time":
    case "input":
    case "text":
    case "password":
      return (
        <>
          <FormLabel>
            {config.label}{" "}
            {config.required && <span className="text-red-500">*</span>}
          </FormLabel>
          <Input
            type={config.type}
            placeholder={config.placeholder}
            {...field}
            disabled={config.disabled}
            readOnly={config.readOnly}
            className={cn(errorClass)}
          />
          {renderError()}
        </>
      );

    case "number":
      return (
        <>
          <FormLabel>
            {config.label}{" "}
            {config.required && <span className="text-red-500">*</span>}
          </FormLabel>
          <div className="relative">
            <Hash className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground opacity-50" />
            <Input
              type="number"
              placeholder={config.placeholder}
              value={field.value ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                field.onChange(v === "" ? null : Number(v));
              }}
              onBlur={field.onBlur}
              ref={field.ref}
              disabled={config.disabled}
              readOnly={config.readOnly}
              className={cn("pl-9", errorClass)}
            />
          </div>
          {renderError()}
        </>
      );

    case "multiline":
    case "textarea":
      return (
        <>
          <FormLabel>
            {config.label}{" "}
            {config.required && <span className="text-red-500">*</span>}
          </FormLabel>
          <Textarea
            rows={config.rows || 3}
            placeholder={config.placeholder}
            {...field}
            disabled={config.disabled}
            readOnly={config.readOnly}
            className={cn(errorClass, config.inputClassName)}
          />
          {renderError()}
        </>
      );

    case "select":
      return <SelectField config={config} field={field} />;

    case "checkbox":
      return (
        <>
          <div className="flex items-center gap-2">
            <Checkbox
              checked={field.value}
              onCheckedChange={field.onChange}
              disabled={config.disabled}
            />
            <FormLabel>{config.label}</FormLabel>
          </div>
          {renderError()}
        </>
      );

    case "switch":
      return (
        <>
          <FormLabel>{config.label}</FormLabel>
          <Switch
            checked={field.value}
            onCheckedChange={field.onChange}
            disabled={config.disabled}
          />
          {renderError()}
        </>
      );

    case "radio":
      return (
        <>
          <FormLabel>
            {config.label}{" "}
            {config.required && <span className="text-red-500">*</span>}
          </FormLabel>

          <RadioGroup
            value={field.value}
            onValueChange={field.onChange}
            className={
              config.error ? "border border-red-500 p-2 rounded-md" : ""
            }
          >
            {config.options?.map((opt) => (
              <label
                key={String(opt.value)}
                className="flex items-center gap-2 cursor-pointer"
              >
                <RadioGroupItem value={String(opt.value)} />
                <span>{opt.label}</span>
              </label>
            ))}
          </RadioGroup>

          {renderError()}
        </>
      );

    case "calender":
      return (
        <>
          <FormLabel>
            {config.label}{" "}
            {config.required && <span className="text-red-500">*</span>}
          </FormLabel>

          <Calendar
            mode="single"
            selected={field.value}
            onSelect={field.onChange}
            className={cn(
              "rounded-lg border",
              config.error && "border-red-500",
            )}
          />

          {renderError()}
        </>
      );

    default:
      return (
        <div className="text-red-500">
          Unsupported field type: {config.type}
        </div>
      );
  }
}

function SelectField({
  config,
  field,
}: {
  config: FieldConfig & { error?: string };
  field: ControllerRenderProps<any, string>;
}) {
  const [open, setOpen] = useState(false);

  const renderError = () =>
    config.error ? (
      <p className="text-sm text-red-500 mt-1">{config.error}</p>
    ) : null;

  return (
    <>
      <FormLabel>
        {config.label}{" "}
        {config.required && <span className="text-red-500">*</span>}
      </FormLabel>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={config.disabled}
            className={cn(
              "w-full justify-between pl-3",
              config.error && "border-red-500",
            )}
          >
            <div className="flex items-center gap-2 truncate">
              <Menu className="h-4 w-4 shrink-0 opacity-50" />
              <span className="truncate">
                {field.value
                  ? config.options?.find(
                      (opt) => String(opt.value) === String(field.value ?? ""),
                    )?.label
                  : config.placeholder}
              </span>
            </div>

            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder={config.placeholder || "Search..."} />
            <CommandList onWheel={(e) => e.stopPropagation()}>
              <CommandEmpty>No option found.</CommandEmpty>
              <CommandGroup>
                {config.options?.map((opt) => (
                  <CommandItem
                    key={String(opt.value)}
                    value={`${opt.label} ${opt.value}`}
                    onSelect={() => {
                      field.onChange(opt.value);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        String(field.value ?? "") === String(opt.value)
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />
                    {opt.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {renderError()}
    </>
  );
}
