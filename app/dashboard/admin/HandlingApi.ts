import axios from "@/utils/axios";

export const targetGetData = async (language?: string) => {
  try {
    const response = await axios.get(`${process.env.HOST_API_KEY}/api/CnfgTargets/get-CnfgTarget`, {
      params: { language }, 
    });

    if (response.status === 200) {
      return response.data.map((item: any, index: number) => ({
        ...item,
        id: index + 1,
      }));
    } else {
      throw new Error("Failed to fetch data");
    }
  } catch (error) {
    console.error("Error fetching data:", error);
    return [];
  }
};
