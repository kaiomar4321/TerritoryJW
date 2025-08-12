export type FilterOption = {
  id: string;
  label: string;
  days: number;
};

export const FILTER_OPTIONS: FilterOption[] = [
  { id: '1d', label: '1 Día', days: 1 },
  { id: '2d', label: '2 Días', days: 2 },
  { id: '3d', label: '3 Días', days: 3 },
  { id: '1w', label: '1 Semana', days: 7 },
  { id: '2w', label: '2 Semanas', days: 14 },
  { id: '1m', label: '1 Mes', days: 30 },
];