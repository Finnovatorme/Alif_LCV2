"use client";

import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import FormComponent, {
  FormFieldConfig,
} from "@/components/FormComponent/FormComponent";
import { ProductSelection } from "@/components/new-application/product-selection";
// import useLocales from "@/hooks/useLocals";

export default function NewApplicationPage() {
  const [activeTab, setActiveTab] = useState("new-application");
  const [newAppData, setNewAppData] = useState<any>(null);
  const [showProductSelection, setShowProductSelection] = useState(false);

  const handleFormSubmit = (formData: any) => {
    console.log("Form submitted:", formData);
    setNewAppData(formData);
    setShowProductSelection(true);
  };

  const formFields: FormFieldConfig[] = [
    {
      type: "text",
      name: "idNumber",
      label: "ID Number",
      required: true,
    },
    {
      type: "date",
      name: "dob",
      label: "Date of Birth",
      required: true,
    },
    {
      type: "number",
      name: "mobileNumber",
      label: "Mobile Number",
      required: true,
    },
    {
      type: "text",
      name: "email",
      label: "Email Address",
    },
    {
      type: "text",
      name: "promoCode",
      label: "Promo Code",
    },
    {
      type: "text",
      name: "referalcode",
      label: "Referral Code",
    },
  ];

  return (
    <div className="flex flex-1 flex-col gap-8 p-4 md:p-8 bg-background min-h-screen">
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold tracking-tight">New Application</h1>

        <FormComponent
          formName="Applicant Details"
          numOfColumns={3}
          formFields={formFields}
          submitBtn={true}
          viewForm={false}
          hideAddNewButton={true}
          submitButtonText="Proceed"
          responseBody={handleFormSubmit}
        />
      </div>

      {showProductSelection && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            {/* <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="new-application">New Application</TabsTrigger>
              <TabsTrigger value="re-finance" disabled>
                Re-Finance
              </TabsTrigger>
            </TabsList> */}
            <TabsContent value="new-application" className="mt-4">
              <ProductSelection newAppFormData={newAppData} />
            </TabsContent>
            <TabsContent value="re-finance">
              {/* <Card>
                <CardHeader>
                  <CardTitle>Re-Finance</CardTitle>
                </CardHeader>
                <CardContent>Coming soon...</CardContent>
              </Card> */}
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
