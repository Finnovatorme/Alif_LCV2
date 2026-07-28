"use client";

import React, { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

interface ScoreNestedTableProps {
  row: any;
  internalData: any[];
}

const ScoreNestedTable = ({ row, internalData }: ScoreNestedTableProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <TableRow className="border-b-0 hover:bg-muted/50 transition-colors">
        <TableCell className="w-[10px]">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-muted"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </TableCell>
        <TableCell className="font-semibold text-sm max-w-[200px] truncate">
          {row.SCORINGPARAMETER}
        </TableCell>
        <TableCell className="text-center">{row.DEFAULTSCORE}</TableCell>
        <TableCell className="text-center">{row.OBTAINEDSCORE}</TableCell>
        <TableCell className="text-center">{row.WEIGHTAGE}%</TableCell>
        <TableCell className="text-center font-bold">
          {row.WEIGHTEDSCORE}
        </TableCell>
        <TableCell className="text-center">
          <span
            className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
              row.ISNEGATIVESCORE
                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
            )}
          >
            {row.ISNEGATIVESCORE ? "Negative" : "Normal"}
          </span>
        </TableCell>
      </TableRow>

      {isOpen && (
        <TableRow className="bg-muted/20 border-b">
          <TableCell colSpan={7} className="p-0">
            <div className="p-4 bg-muted/30 border-x border-b rounded-b-xl animate-in fade-in slide-in-from-top-1 duration-200">
              <Table className="bg-white dark:bg-zinc-900/50 rounded-lg overflow-hidden border shadow-sm">
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="text-[10px] uppercase font-bold tracking-wider">
                      Parameter
                    </TableHead>
                    <TableHead className="text-center text-[10px] uppercase font-bold tracking-wider">
                      Score
                    </TableHead>
                    <TableHead className="text-center text-[10px] uppercase font-bold tracking-wider">
                      Rule Scanned
                    </TableHead>
                    <TableHead className="text-center text-[10px] uppercase font-bold tracking-wider">
                      Result
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {internalData.length > 0 ? (
                    internalData.map((item, index) => (
                      <TableRow
                        key={index}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <TableCell className="text-sm">
                          {item?.PARAMETER}
                        </TableCell>
                        <TableCell className="text-center font-medium">
                          {item?.SCORE}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center">
                            {item?.RULESCANNED ? (
                              <CheckCircle2 className="h-4 w-4 text-blue-500" />
                            ) : (
                              <HelpCircle className="h-4 w-4 text-muted-foreground/50" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center">
                            <span
                              className={cn(
                                "flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold",
                                item?.RULERESULT
                                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                  : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                              )}
                            >
                              {item?.RULERESULT ? (
                                <>
                                  <CheckCircle2 className="h-3 w-3" />
                                  PASS
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-3 w-3" />
                                  FAIL
                                </>
                              )}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center py-4 text-muted-foreground italic text-sm"
                      >
                        No detailed parameters found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
};

export default ScoreNestedTable;
