export const FILTER_OPTIONS = [
  {
    id: 'active',
    label: 'Incompleto',
    icon: 'alert-circle-outline'
  },
  {
    id: 'completed',
    label: 'Terminados',
    icon: 'checkmark-circle-outline'
  },
] as const;

export type FilterOption = typeof FILTER_OPTIONS[number];