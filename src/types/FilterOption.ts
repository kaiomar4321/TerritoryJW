// FilterOption.ts
export const FILTER_OPTIONS = [
  {
    id: "ready",
    label: "Listos",
    icon: "time-outline",
    colorHex: "#3b82f6",
    
  },
  {
    id: "incomplete",
    label: "Incompletos",
    icon: "alert-circle-outline",
    colorHex: "#eab308",
  },
  {
    id: "completed",
    label: "Terminados",
    icon: "checkmark-circle-outline",
    colorHex: "#22c55e",
  },
] as const;

export type FilterOption = typeof FILTER_OPTIONS[number]["id"];
