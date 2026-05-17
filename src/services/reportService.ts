import { Territory } from '~/types/Territory';

// ─── date formatting ────────────────────────────────────────────────────────

export const formatDate = (value: any): string => {
  if (!value) return '—';
  try {
    const date = value?.toDate ? value.toDate() : new Date(value);
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch {
    return '—';
  }
};

export const formatDateShort = (value: any): string => {
  if (!value) return '—';
  try {
    const date = value?.toDate ? value.toDate() : new Date(value);
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  } catch {
    return '—';
  }
};

// ─── territory helpers ──────────────────────────────────────────────────────

export const isCompleted = (t: Territory): boolean => !!t.visitStartDate && !!t.visitEndDate;

export const isInProgress = (t: Territory): boolean => !!t.visitStartDate && !t.visitEndDate;
// ─── sorting ────────────────────────────────────────────────────────────────

export type SortKey = 'number_asc' | 'number_desc' | 'date_asc' | 'date_desc';

export const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'number_asc', label: 'Nº ↑' },
  { key: 'number_desc', label: 'Nº ↓' },
  { key: 'date_asc', label: 'Fecha ↑' },
  { key: 'date_desc', label: 'Fecha ↓' },
];

export const sortTerritories = (list: Territory[], sort: SortKey): Territory[] => {
  return [...list].sort((a, b) => {
    if (sort === 'number_asc') return a.number - b.number;
    if (sort === 'number_desc') return b.number - a.number;

    const dateA = a.visitEndDate ? new Date(a.visitEndDate).getTime() : 0;
    const dateB = b.visitEndDate ? new Date(b.visitEndDate).getTime() : 0;
    if (sort === 'date_asc') return dateA - dateB;
    return dateB - dateA; // date_desc
  });
};

// ─── report generation ──────────────────────────────────────────────────────

export interface ReportStats {
  total: number;
  completed: number;
  incomplete: number;
  ready: number;
}

export const generateReportStats = (territories: Territory[]): ReportStats => {
  const total = territories.length;
  const completed = territories.filter(isCompleted).length;
  const incomplete = territories.filter(isInProgress).length;
  const ready = total - completed - incomplete;
  return { total, completed, incomplete, ready };
};

export const generateReportText = (
  completedTerritories: Territory[],
  stats: ReportStats
): string => {
  const lines = completedTerritories.map(
    (t) =>
      `Territorio ${t.number} — ${t.name}\n  Inicio: ${formatDateShort(t.visitStartDate)}\n  Completado: ${formatDateShort(t.visitEndDate)}${t.note ? `\n  Nota: ${t.note}` : ''}`
  );

  const header = `📋 REPORTE DE TERRITORIOS COMPLETADOS\n${'─'.repeat(38)}\nTotal completados: ${stats.completed} / ${stats.total}\n${'─'.repeat(38)}\n\n`;
  const body = lines.join('\n\n');
  const footer = `\n\n${'─'.repeat(38)}\nGenerado el ${formatDate(new Date())}`;

  return header + body + footer;
};
