export type Option = {
  label: string;
  value: string | number; // ✅ you use numbers in dropdowns
};

export type FieldType =
  | "input"
  | "text"
  | "password"
  | "number"
  | "textarea"
  | "select"
  | "checkbox"
  | "switch"
  | "radio"
  | "date"
  | "time"
  | "calender"
  | "file"
  | "section"; // ✅ add section

// ✅ Base field (normal inputs)
export interface FieldConfig {
  name: string;
  label: string;
  type: Exclude<FieldType, "section">; // ✅ section is not a normal field type
  placeholder?: string;
  options?: Option[];
  description?: string;

  accept?: string;
  multiple?: boolean;
  limit?: number;
  group?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;

  // keep extra keys you already pass sometimes
  error?: string;
}

// ✅ Section type (group of fields)
export type SectionFieldConfig = {
  type: "section";
  title: string;
  fields: FieldConfig[];
};

// ✅ What you should use everywhere (supports both normal + section)
export type AnyFieldConfig = FieldConfig | SectionFieldConfig;
