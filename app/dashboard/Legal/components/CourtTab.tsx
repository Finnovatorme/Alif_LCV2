"use client";

import React, { useState } from "react";
import { LegalCaseRecord } from "../HandlingAPIs";
import { HearingTab } from "./HearingTab";
import { DecisionTab } from "./DecisionTab";
import { EnforcementTab } from "./EnforcementTab";

export interface CourtTabProps {
  activeSubTab?: "hearing" | "decision" | "enforcement";
  onSubTabChange?: (tab: "hearing" | "decision" | "enforcement") => void;
  legalCase?: LegalCaseRecord | null;
  cifId?: number | string;
  loanId?: number | string;
  language?: number;
}

export const CourtTab: React.FC<CourtTabProps> = ({
  activeSubTab: propSubTab,
  onSubTabChange,
  legalCase,
  cifId,
  loanId,
  language,
}) => {
  const [localSubTab] = useState<"hearing" | "decision" | "enforcement">("hearing");
  const subTab = propSubTab || localSubTab;

  if (subTab === "hearing") {
    return (
      <HearingTab
        legalCase={legalCase}
        cifId={cifId}
        loanId={loanId}
        language={language}
      />
    );
  }

  if (subTab === "decision") {
    return (
      <DecisionTab
        legalCase={legalCase}
        cifId={cifId}
        loanId={loanId}
        language={language}
      />
    );
  }

  return (
    <EnforcementTab
      legalCase={legalCase}
      cifId={cifId}
      loanId={loanId}
      language={language}
    />
  );
};
