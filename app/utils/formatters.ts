import { formatDateKSA, formatAmountKSA } from "@/utils/helpers";

export const formatDate = (date?: string | Date | null) =>
  formatDateKSA(date);

export const formatAmount = (amount?: number | string | null) =>
  formatAmountKSA(amount);
