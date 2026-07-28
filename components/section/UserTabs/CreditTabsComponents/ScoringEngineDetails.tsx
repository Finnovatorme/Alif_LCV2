"use client";

import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import ScoreNestedTable from "./ScoreNestedTable";
import { formatDateKSA } from "@/utils/helpers";
import {
  Trophy,
  Activity,
  CreditCard,
  User,
  Calendar,
  Layers,
} from "lucide-react";

const ScoringEngineDetails = ({ scoringDetails }: { scoringDetails: any }) => {
  const [activeTab, setActiveTab] = useState("score");

  const summaryData = scoringDetails?.Array1?.[0] || {};
  const detailsData = scoringDetails?.Array2 || [];
  const nestedData = scoringDetails?.Array3 || [];

  const summaryFields = [
    { label: "Calculate Risk", value: summaryData.CALCULATERISK, icon: Activity },
    { label: "Calculate Decision", value: summaryData.CALCULATEDECISION, icon: HelpCircle },
    { label: "Calculate Pricing", value: summaryData.CALCULATEPRICING, icon: CreditCard },
    { label: "Total Score", value: summaryData.TOTALSCORE, icon: Layers },
    { label: "Obtained Score", value: summaryData.OBTAINEDSCORE, icon: Trophy },
    { label: "Score Card Risk", value: summaryData.SCORECARDRISK, icon: Activity },
    { label: "Score Card Decision", value: summaryData.SCORECARDDECISION, icon: HelpCircle },
    { label: "Pricing Rate", value: summaryData.PRICINGRATE, icon: CreditCard },
    { label: "Transaction ID", value: summaryData.TRANSACTIONID, icon: User },
    { label: "Update By", value: summaryData.UPDATEBY, icon: User },
    { label: "Update Date", value: formatDateKSA(summaryData.UPDATEDATE), icon: Calendar },
    { label: "Record Status", value: summaryData.RECSTATUS, icon: Layers },
  ];

  function HelpCircle(props: any) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <path d="M12 17h.01" />
      </svg>
    )
  }

  return (
    <div className="space-y-8">
      <Tabs defaultValue="score" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 bg-muted p-1 max-w-2xl mx-auto rounded-xl h-12">
          <TabsTrigger value="score" className="rounded-md">
            Score Summary
          </TabsTrigger>
          <TabsTrigger value="details" className="rounded-md">
            Detailed Parameters
          </TabsTrigger>
        </TabsList>

        <TabsContent value="score" className="mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {summaryFields.map((field, idx) => (
              <Card key={idx} className="border bg-card/50 overflow-hidden">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                    <field.icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider truncate">
                      {field.label}
                    </p>
                    <p className="text-sm font-semibold truncate capitalize">
                      {field.value?.toString() || "-"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="details" className="mt-4">
          <div className="border rounded-xl overflow-hidden bg-card/30">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[40px]"></TableHead>
                  <TableHead className="w-[40%] text-[11px] font-bold uppercase">Scoring Parameter</TableHead>
                  <TableHead className="text-center text-[11px] font-bold uppercase">Default Score</TableHead>
                  <TableHead className="text-center text-[11px] font-bold uppercase">Obtained Score</TableHead>
                  <TableHead className="text-center text-[11px] font-bold uppercase">Weightage</TableHead>
                  <TableHead className="text-center text-[11px] font-bold uppercase">Wt. Score</TableHead>
                  <TableHead className="text-center text-[11px] font-bold uppercase">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detailsData.length > 0 ? (
                  detailsData.map((item: any, index: number) => {
                    const innerRows = nestedData.filter(
                      (arrData: any) => arrData.TSETSDRECID === item.TSETSDRECID
                    );
                    return (
                      <ScoreNestedTable
                        key={index}
                        row={item}
                        internalData={innerRows}
                      />
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground italic">
                      No scoring parameters found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ScoringEngineDetails;
