import axios from "@/utils/axios";

export const targetGetData = async (language?: string) => {
  try {
    const response = await axios.get(`${process.env.HOST_API_KEY}/api/CnfgTargets/get-CnfgTarget`, {
      params: { language }, 
    });

    if (response.status === 200) {
      const rawData = response.data;
      const list = Array.isArray(rawData)
        ? rawData
        : Array.isArray(rawData?.data)
        ? rawData.data
        : [];

      return list.map((item: any, index: number) => ({
        ...item,
        id: item.TCTRECID ?? index + 1,
      }));
    } else {
      throw new Error("Failed to fetch data");
    }
  } catch (error) {
    console.error("Error fetching data:", error);
    return [];
  }
};
