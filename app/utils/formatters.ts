export const formatDate = (date?: string) =>
  date ? new Date(date).toLocaleDateString() : "—";

export const formatAmount = (amount?: number) =>
  amount ? amount.toLocaleString() : "—";
