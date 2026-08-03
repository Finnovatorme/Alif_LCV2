import axios from "./axios";

export type Option = {
  value: string | number;
  label: string;
  depend?: string | number;
};

type VbItem = {
  RECID: string | number;
  VALDESC1: string;
};

export const vbValue = async (
  category: string | number,
  language?: string,
): Promise<Option[]> => {
  try {
    const response = await axios.get(
      `${process.env.BS_API_KEY}/api/CnfgVbValues/GetCnfgVbValues/${category}`,
      { params: { language } }
    );

    const data = response.data as VbItem[];

    const options: Option[] = data.map((item) => ({
      value: item.RECID,
      label: item.VALDESC1,
    }));

    return options;
  } catch (error) {
    console.error(`Error fetching ${category} options:`, error);
    return [];
  }
};

type FinancierItem = {
  Financierid: string | number;
  Financiername1: string;
};

export const fetchFinancierOptions = async (): Promise<Option[]> => {
  try {
    const response = await axios.get(
      `${process.env.BS_API_KEY}/api/CnfgMasterFinancier/GetCnfgMasterFinancier`,
    );
    const Financier = response.data as FinancierItem[];

    const options: Option[] = Financier.map((financier) => ({
      value: financier.Financierid,
      label: financier.Financiername1,
    }));

    return options;
  } catch (error) {
    console.error("Error fetching Financier options:", error);
    return [];
  }
};

type AssetItem = {
  ASSETRECID: string | number;
  ASSETNAME: string;
};

export const fetchAssetsOptions = async (): Promise<Option[]> => {
  try {
    const response = await axios.get(
      `${process.env.BS_API_KEY}/api/AssetFinMasterSupplierAssets/GetAssetFinMasterSupplierAssets`,
    );
    const Assets = response.data as AssetItem[];

    const options: Option[] = Assets.map((asset) => ({
      value: asset.ASSETRECID,
      label: asset.ASSETNAME,
    }));

    return options;
  } catch (error) {
    console.error("Error fetching Financier options:", error);
    return [];
  }
};

type ProductItem = {
  Productcode: string | number;
  Productname1?: string | null;
};

export const fetchProductOptions = async (): Promise<Option[]> => {
  try {
    const response = await axios.get(
      `${process.env.BS_API_KEY}/api/CnfgMasterProducts/GetCnfgMasterProducts`,
    );
    const product = response.data as ProductItem[];

    const options: Option[] = product.map((pro) => ({
      value: pro.Productcode,
      label: pro.Productname1 ? pro.Productname1 : "-",
    }));

    return options;
  } catch (error) {
    console.error("Error fetching Product options:", error);
    return [];
  }
};

type SubProductItem = {
  Subproductcode: string | number;
  Subproductname1?: string | null;
  Productcode?: string | number | null;
};

export const fetchSubProductOptions = async (): Promise<Option[]> => {
  try {
    const response = await axios.get(
      `${process.env.BS_API_KEY}/api/CnfgMasterSubproducts/GetCnfgMasterSubProducts`,
    );
    const subproduct = response.data as SubProductItem[];

    const options: Option[] = subproduct.map((pro) => ({
      value: pro.Subproductcode,
      label: pro.Subproductname1 ? pro.Subproductname1 : "-",
      depend: pro.Productcode ? pro.Productcode : "-",
    }));

    return options;
  } catch (error) {
    console.error("Error fetching Sub-Product options:", error);
    return [];
  }
};

type AppCifItem = {
  APPCIFID: string | number;
  CUSTOMERFULLNAME?: string | null;
};

export const fetchAppCifOptions = async (): Promise<Option[]> => {
  try {
    const response = await axios.get(
      `${process.env.LO_API_KEY}/api/ApplCifCustDetails`,
    );
    const appCifIdOptions = response.data as AppCifItem[];

    const options: Option[] = appCifIdOptions.map((opt) => ({
      value: opt.APPCIFID,
      label: opt.CUSTOMERFULLNAME ? opt.CUSTOMERFULLNAME : "-",
    }));

    return options;
  } catch (error) {
    console.error("Error fetching App CIF ID options:", error);
    return [];
  }
};

type ChargeItem = {
  Chargeid: string | number;
  Chargename1: string;
};

export const fetchChargeIdOptions = async (): Promise<Option[]> => {
  try {
    const response = await axios.get(
      `${process.env.BS_API_KEY}/api/CnfgMasterCharges/GetCnfgMasterCharges`,
    );
    const chargeIdOptions = response.data as ChargeItem[];

    const options: Option[] = chargeIdOptions.map((opt) => ({
      value: opt.Chargeid,
      label: opt.Chargename1,
    }));

    return options;
  } catch (error) {
    console.error("Error fetching Charge ID options:", error);
    return [];
  }
};

type AppIdItem = {
  APPID: string | number;
};

export const fetchAppIdOptions = async (): Promise<Option[]> => {
  try {
    const response = await axios.get(
      `${process.env.LO_API_KEY}/api/APPL_APPLICATION`,
    );
    const applicationIdOptions = response.data as AppIdItem[];

    const options: Option[] = applicationIdOptions.map((opt) => ({
      value: opt.APPID,
      label: String(opt.APPID),
    }));

    return options;
  } catch (error) {
    console.error("Error fetching Application ID options:", error);
    return [];
  }
};

type SchemeIdItem = {
  SCHEMEID: string | number;
};

export const fetchSchemeIdOptions = async (): Promise<Option[]> => {
  try {
    const response = await axios.get(
      `${process.env.LO_API_KEY}/api/ApplScheme`,
    );
    const schemeIdOptions = response.data as SchemeIdItem[];

    const options: Option[] = schemeIdOptions.map((opt) => ({
      value: opt.SCHEMEID,
      label: String(opt.SCHEMEID),
    }));

    return options;
  } catch (error) {
    console.error("Error fetching Scheme ID options:", error);
    return [];
  }
};

type LCAllocationItem = {
  RECID: string | number;
  TCTGRECID?: string | number;
  VALDESC1: string;
};

export const fetchLCAllocationGroupOptions = async (language?: string): Promise<any[]> => {
  try {
    const response = await axios.get(
      `${process.env.BS_API_KEY}/api/CnfgVbValues/GetCnfgVbValues/LCALLOCATIONGROUP`,
      { params: { language } }
    );
    const Data = response.data as LCAllocationItem[];
    const options = Data.map((item) => ({
      id: item.RECID.toString(),
      tctgrecid: item?.TCTGRECID,
      name: item.VALDESC1,
      containerId: "Group",
    }));
    return options;
  } catch (error) {
    console.error("Error fetching LC Allocation Group options:", error);
    return [];
  }
};
