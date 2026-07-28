"use client";

import React from "react";
import { X } from "lucide-react";
import { Button } from "./button";
import Image from "next/image";
import { formatDateKSA, isDateString } from "@/utils/helpers";

interface ViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: Record<string, any> | null;
  title?: string;
  keyMappings?: Record<string, string>;
}

export const ViewModal: React.FC<ViewModalProps> = ({
  isOpen,
  onClose,
  data,
  title = "View Details",
  keyMappings = {},
}) => {
  if (!isOpen || !data) return null;

  const formatBoolean = (value: boolean) => (value ? "Yes" : "No");
  console.log("data", data);
  const formatAmount = (value: any) => {
    if (value === null || value === undefined || isNaN(value)) return "-";
    return Number(value).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const isImageField = (key: string) =>
    key.toLowerCase().includes("image") ||
    key.toLowerCase().includes("logo") ||
    key.toLowerCase().includes("icon") ||
    key.toLowerCase().includes("pic");

  const renderValue = (key: string) => {
    const value = data[key];

    if (value === null || value === undefined || value === "") return "-";

    if (typeof value === "boolean") return formatBoolean(value);

    if (
      key.toLowerCase().includes("amount") ||
      key.toLowerCase().includes("os") ||
      key.toLowerCase().includes("paid") ||
      key.toLowerCase().includes("charges")
    ) {
      return formatAmount(value);
    }

    if (isImageField(key)) {
      return (
        <Image
          src={
            value.startsWith("data:image")
              ? value
              : `data:image/jpeg;base64,${value}`
          }
          alt="Image"
          width={100}
          height={100}
          className="max-h-28 object-contain"
        />
      );
    }

    if (isDateString(value)) {
      return formatDateKSA(value);
    }

    return String(value);
  };

  const entries = Object.entries(keyMappings);
  const rows = [];
  for (let i = 0; i < entries.length; i += 2) {
    rows.push(entries.slice(i, i + 2));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-fit md:min-w-[850px] min-h-[400px] max-h-[90vh] overflow-hidden flex flex-col relative">
        <div className="absolute top-0 left-0 right-0 h-1.5 w-full bg-linear-to-r from-blue-500 via-indigo-500 to-violet-500 z-50" />
        <div className="flex justify-between items-center px-6 py-5 border-b dark:border-gray-700">
          <h2 className="text-xl font-bold">{title}</h2>
          <X className="cursor-pointer" onClick={onClose} />
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <table className="w-full border-collapse">
            <tbody>
              {rows.map((pair, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={`border-b ${
                    rowIndex % 2 === 0 ? "bg-gray-50 dark:bg-gray-800" : ""
                  }`}
                >
                  <td className="px-4 py-3 font-semibold w-1/6">
                    {pair[0]?.[1]}
                  </td>
                  <td className="px-4 py-3 w-1/3">
                    {pair[0] ? renderValue(pair[0][0]) : "-"}
                  </td>

                  <td className="px-4 py-3 font-semibold w-1/6">
                    {pair[1]?.[1] ?? ""}
                  </td>
                  <td className="px-4 py-3 w-1/3">
                    {pair[1] ? renderValue(pair[1][0]) : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end px-6 py-4 border-t dark:border-gray-700">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
};
