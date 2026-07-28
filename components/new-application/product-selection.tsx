"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Truck, FileText, Handshake, CreditCard } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import {
  fetchProductOptions,
  fetchSubProductOptions,
} from "@/utils/dropDownApis";
import axios from "@/utils/axios";
import { useAuth } from "@/hooks/useAuth";

interface ProductSelectionProps {
  newAppFormData: any;
}

interface Option {
  value: string | number;
  label: string;
  depend?: string | number;
}

export function ProductSelection({ newAppFormData }: ProductSelectionProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [products, setProducts] = useState<Option[]>([]);
  const [subProducts, setSubProducts] = useState<Option[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Option | null>(null);
  const [selectedSubProduct, setSelectedSubProduct] = useState<Option | null>(
    null,
  );
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const productIcons: Record<string, React.ReactNode> = {
    IJR: <Truck className="w-8 h-8 mb-2" />,
    MURBS: <Handshake className="w-8 h-8 mb-2" />,
    MURB: <CreditCard className="w-8 h-8 mb-2" />,
    TWQ: <FileText className="w-8 h-8 mb-2" />,
  };

  useEffect(() => {
    const loadOptions = async () => {
      const prodOptions = await fetchProductOptions();
      const subProdOptions = await fetchSubProductOptions();
      setProducts(prodOptions);
      setSubProducts(subProdOptions);
    };
    loadOptions();
  }, []);

  const filteredSubProducts = selectedProduct
    ? subProducts.filter((sub) => sub.depend === selectedProduct.value)
    : [];

  const handleInitiateApplication = async () => {
    if (!selectedProduct || !selectedSubProduct) {
      toast.error("Please select both product and subproduct");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        productCode: selectedProduct.value,
        subProductCode: selectedSubProduct.value,
        maker: user?.userId,
        makeDate: new Date().toISOString(),
        checker: user?.userId,
        checkDate: new Date().toISOString(),
        updateBy: user?.userId,
        updateDate: new Date().toISOString(),
        recStatus: true,
        ...newAppFormData,
      };

      if (payload.MOBILENUMBER !== undefined && payload.MOBILENUMBER !== null) {
        payload.MOBILENUMBER = String(payload.MOBILENUMBER);
      }

      console.log("Sending payload:", payload);
      const response = await axios.post(
        `${process.env.LO_API_KEY}/api/APPL_APPLICATION`,
        payload
      );
      if (
        response.data?.message === "Success" ||
        response.status === 200 ||
        response.status === 201
      ) {
        toast.success("Application has been created successfully");
        router.push("/dashboard");
      } else {
        toast.error("Failed to Initiate New Application.");
      }
    } catch (error: any) {
      console.error("Error creating application:", error);
      toast.error("Failed to Initiate New Application.");
    } finally {
      setLoading(false);
      setIsConfirmationOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <CardContent className="space-y-6 pt-6">
          <h3 className="text-lg font-semibold">
            Select Product & Sub-Product:
          </h3>

          {/* Flex row: Product 2/3, Sub-Product 1/3 */}
          <div className="flex flex-col md:flex-row gap-6">
            {/* Product Column - Larger */}
            <div className="flex-2">
              <h4 className="text-sm font-medium mb-2">Product Code</h4>
              <div className="flex flex-wrap gap-4">
                {products.map((product) => (
                  <div
                    key={product.value}
                    onClick={() => {
                      setSelectedProduct(product);
                      setSelectedSubProduct(null);
                    }}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all w-48 h-32
                      ${
                        selectedProduct?.value === product.value
                          ? "border-primary bg-primary/5 dark:bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                  >
                    {productIcons[String(product.value)] || (
                      <FileText className="w-8 h-8 mb-2" />
                    )}
                    <span className="text-center font-medium">
                      {product.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sub-Product Column - Smaller */}
            <div className="flex-1">
              <h4 className="text-sm font-medium mb-2">Sub-Product Code</h4>
              <div className="flex flex-wrap gap-4">
                {filteredSubProducts.length > 0 ? (
                  filteredSubProducts.map((subProduct) => (
                    <div
                      key={subProduct.value}
                      onClick={() => setSelectedSubProduct(subProduct)}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all w-48 h-32
                        ${
                          selectedSubProduct?.value === subProduct.value
                            ? "border-primary bg-primary/5 dark:bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }`}
                    >
                      {productIcons[String(subProduct.depend)] || (
                        <FileText className="w-8 h-8 mb-2" />
                      )}
                      <span className="text-center font-medium">
                        {subProduct.label}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-muted-foreground italic">
                    No sub-products available
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="pt-4">
            <Button
              size="lg"
              onClick={() => setIsConfirmationOpen(true)}
              disabled={!selectedProduct || !selectedSubProduct}
            >
              Initiate Application
            </Button>
          </div>
        </CardContent>
      </Card>

      <ConfirmationModal
        isOpen={isConfirmationOpen}
        onClose={() => setIsConfirmationOpen(false)}
        onConfirm={handleInitiateApplication}
        title="Confirm Initiation?"
        description="Are you sure you want to Initiate the New Application?"
        confirmText="Yes, Initiate"
        cancelText="No, Cancel"
        loading={loading}
      />
    </div>
  );
}
