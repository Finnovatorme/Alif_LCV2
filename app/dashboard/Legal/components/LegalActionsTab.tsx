"use client";

import React, { useState } from "react";
import Audittrail from "@/components/section/UserTabs/Actions/Audittrail";
import Comments from "@/components/section/UserTabs/Actions/Comments";
import Notifications from "@/components/section/UserTabs/Actions/Notifications";
import Checklist from "@/components/section/UserTabs/Actions/Checklist";

interface LegalActionsTabProps {
  activeSubTab?: "audit" | "comments" | "notifications" | "checklist";
  onSubTabChange?: (tab: "audit" | "comments" | "notifications" | "checklist") => void;
  language?: number;
  appId?: string | number;
  twtrecid?: string | number;
}

export const LegalActionsTab: React.FC<LegalActionsTabProps> = ({
  activeSubTab: propSubTab,
  onSubTabChange,
  language = 1,
  appId,
  twtrecid,
}) => {
  const isAr = language === 2;
  const [localSubTab, setLocalSubTab] = useState<"audit" | "comments" | "notifications" | "checklist">("comments");
  const subTab = propSubTab || localSubTab;

  return (
    <div className="w-full animate-in fade-in duration-200" dir={isAr ? "rtl" : "ltr"}>
      {subTab === "comments" && <Comments appId={appId} />}
      {subTab === "notifications" && <Notifications appId={appId} />}
      {subTab === "audit" && <Audittrail appId={appId} />}
      {subTab === "checklist" && (
        <Checklist appId={appId} twtrecid={twtrecid} language={language} />
      )}
    </div>
  );
};

export default LegalActionsTab;
