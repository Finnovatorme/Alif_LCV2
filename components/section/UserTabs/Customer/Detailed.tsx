import React from "react";

type DetailProps = {
  label: string;
  value?: string | number | null;
};

const Detail: React.FC<DetailProps> = ({ label, value }) => {
  const displayValue =
    value === null || value === undefined || value === "" ? "—" : String(value);

  return (
    <div className="space-y-1">
      <p className="text-[11px] uppercase tracking-wider text-gray-500 dark:text-gray-400">
        {label}
      </p>
      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 wrap-break-word">
        {displayValue}
      </p>
    </div>
  );
};

export default Detail;
