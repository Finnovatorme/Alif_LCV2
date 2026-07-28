import axios from "@/utils/axios";

export type Option = {
  value: string | number;
  label: string;
  depend?: string | number;
};

type VbItem = { RECID: string | number; VALDESC1: string };
type FinancierItem = { Financierid: string | number; Financiername1: string };
type ProductItem = {
  Productcode: string | number;
  Productname1?: string | null;
};
type SubProductItem = {
  Subproductcode: string | number;
  Subproductname1?: string | null;
  Productcode?: string | number | null;
};
type AppCifItem = {
  APPCIFID: string | number;
  CUSTOMERFULLNAME?: string | null;
};
type ChargeItem = { Chargeid: string | number; Chargename1: string };
type AppIdItem = { APPID: string | number };
type SchemeIdItem = { SCHEMEID: string | number };

export const vbValue = async (category: string | number): Promise<Option[]> => {
  try {
    const response = await axios.get(
      `${process.env.BS_API_KEY}/api/CnfgVbValues/GetCnfgVbValues/${category}`,
      { withCredentials: true },
    );
    const data = response.data as VbItem[];
    return data.map(
      (item): Option => ({
        value: item.RECID,
        label: item.VALDESC1,
      }),
    );
  } catch (error) {
    console.error(`Error fetching ${category} options:`, error);
    return [];
  }
};

export const fetchFinancierOptions = async (): Promise<Option[]> => {
  try {
    const response = await axios.get(
      `${process.env.BS_API_KEY}/api/CnfgMasterFinancier/GetCnfgMasterFinancier`,
    );
    const financier = response.data as FinancierItem[];
    return financier.map(
      (f): Option => ({
        value: f.Financierid,
        label: f.Financiername1,
      }),
    );
  } catch (error) {
    console.error("Error fetching Financier options:", error);
    return [];
  }
};

export const fetchProductOptions = async (): Promise<Option[]> => {
  try {
    const response = await axios.get(
      `${process.env.BS_API_KEY}/api/CnfgMasterProducts/GetCnfgMasterProducts`,
    );
    const product = response.data as ProductItem[];
    return product.map(
      (p): Option => ({
        value: p.Productcode,
        label: p.Productname1 ? p.Productname1 : "-",
      }),
    );
  } catch (error) {
    console.error("Error fetching Product options:", error);
    return [];
  }
};

export const fetchSubProductOptions = async (): Promise<Option[]> => {
  try {
    const response = await axios.get(
      `${process.env.BS_API_KEY}/api/CnfgMasterSubproducts/GetCnfgMasterSubProducts`,
    );
    const subproduct = response.data as SubProductItem[];
    return subproduct.map(
      (p): Option => ({
        value: p.Subproductcode,
        label: p.Subproductname1 ? p.Subproductname1 : "-",
        depend: p.Productcode ? p.Productcode : "-",
      }),
    );
  } catch (error) {
    console.error("Error fetching Sub-Product options:", error);
    return [];
  }
};

export const fetchAppCifOptions = async (): Promise<Option[]> => {
  try {
    const response = await axios.get(
      `${process.env.LO_API_KEY}/api/ApplCifCustDetails`,
    );
    const appCifIdOptions = response.data as AppCifItem[];
    return appCifIdOptions.map(
      (opt): Option => ({
        value: opt.APPCIFID,
        label: opt.CUSTOMERFULLNAME ? opt.CUSTOMERFULLNAME : "-",
      }),
    );
  } catch (error) {
    console.error("Error fetching App CIF ID options:", error);
    return [];
  }
};

export const fetchChargeIdOptions = async (): Promise<Option[]> => {
  try {
    const response = await axios.get(
      `${process.env.BS_API_KEY}/api/CnfgMasterCharges/GetCnfgMasterCharges`,
    );
    console.log("get chargeid response", response);
    const chargeIdOptions = response.data as ChargeItem[];
    return chargeIdOptions.map(
      (opt): Option => ({
        value: opt.Chargeid,
        label: opt.Chargename1,
      }),
    );
  } catch (error) {
    console.error("Error fetching Charge ID options:", error);
    return [];
  }
};

export const fetchAppIdOptions = async (): Promise<Option[]> => {
  try {
    const response = await axios.get(
      `${process.env.LO_API_KEY}/api/APPL_APPLICATION`,
    );
    const applicationIdOptions = response.data as AppIdItem[];
    return applicationIdOptions.map(
      (opt): Option => ({
        value: opt.APPID,
        label: String(opt.APPID),
      }),
    );
  } catch (error) {
    console.error("Error fetching Application ID options:", error);
    return [];
  }
};

export const fetchSchemeIdOptions = async (): Promise<Option[]> => {
  try {
    const response = await axios.get(
      `${process.env.LO_API_KEY}/api/ApplScheme`,
    );
    const schemeIdOptions = response.data as SchemeIdItem[];
    return schemeIdOptions.map(
      (opt): Option => ({
        value: opt.SCHEMEID,
        label: String(opt.SCHEMEID),
      }),
    );
  } catch (error) {
    console.error("Error fetching Scheme ID options:", error);
    return [];
  }
};
