import { useMemo, useState } from 'react';
import { Share, Alert, Platform } from 'react-native';

import * as FileSystem from 'expo-file-system';
import { useTerritory } from './useTerritory';
import { useGroup } from './useGroup';
import { useUsers } from './useUsers';
import { Territory } from '~/types/Territory';
import {
  isCompleted,
  sortTerritories,
  generateReportStats,
  generateReportText,
  SortKey,
  SORT_OPTIONS,
} from '~/services/reportService';
import { generateReportHTML } from '~/services/pdfReportService';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';


export interface UseReportReturn {
  territories: Territory[];
  completedTerritories: Territory[];
  leaderNameByGroupId: Map<string, string>;
  stats: ReturnType<typeof generateReportStats>;
  sortKey: SortKey;
  setSortKey: (key: SortKey) => void;
  isLoading: boolean;
  error: Error | null;
  handleShare: () => Promise<void>;
  handleGeneratePDF: () => Promise<void>;
  isGeneratingPDF: boolean;
  sortOptions: typeof SORT_OPTIONS;
}

export const useReport = (): UseReportReturn => {
  const { territories, isLoading, error } = useTerritory({ revalidateOnFocus: false });
  const { groups } = useGroup();
  const { users } = useUsers();
  const [sortKey, setSortKey] = useState<SortKey>('number_asc');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const completedTerritories = useMemo(
    () => sortTerritories(territories.filter(isCompleted), sortKey),
    [territories, sortKey]
  );

  const stats = useMemo(() => generateReportStats(territories), [territories]);

  const leaderNameByGroupId = useMemo(() => {
    const usersById = new Map(
      users.map((user) => [
        user.id,
        user.displayName ||  user.email || '—',
      ])
    );

    return new Map(
      groups.map((group) => [
        group.id,
        usersById.get(group.leaderId) || '—',
      ])
    );
  }, [groups, users]);

  const handleShare = async () => {
    try {
      const reportText = generateReportText(completedTerritories, stats);
      await Share.share({
        message: reportText,
        title: 'Reporte de Territorios',
      });
    } catch (e) {
      // user cancelled share
    }
  };

  const handleGeneratePDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const html = generateReportHTML(completedTerritories, leaderNameByGroupId);

// 1. Genera el PDF en un archivo temporal
const { uri } = await Print.printToFileAsync({
  html,
  base64: false,
});

// 2. Mueve y renombra usando la nueva API
const fileName = `Reporte-Territorios-${new Date().toISOString().split('T')[0]}.pdf`;
const tempFile = new File(uri);
const finalFile = new File(Paths.document, fileName);

// Si ya existe un archivo con ese nombre, bórralo primero
if (finalFile.exists) {
  finalFile.delete();
}

tempFile.move(finalFile);

// 3. Comparte
const canShare = await Sharing.isAvailableAsync();
if (canShare) {
  await Sharing.shareAsync(finalFile.uri, {
    mimeType: 'application/pdf',
    dialogTitle: 'Compartir reporte de territorios',
    UTI: 'com.adobe.pdf',
  });
} else {
  Alert.alert(
    '✅ PDF Generado',
    `El reporte se ha guardado en:\n${finalFile.uri}`,
    [{ text: 'OK' }]
  );
}
    } catch (err) {
      Alert.alert(
        '❌ Error',
        'No se pudo generar el PDF. Intenta de nuevo.',
        [{ text: 'OK' }]
      );
      console.error('PDF generation error:', err);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return {
    territories,
    completedTerritories,
    leaderNameByGroupId,
    stats,
    sortKey,
    setSortKey,
    isLoading,
    error,
    handleShare,
    handleGeneratePDF,
    isGeneratingPDF,
    sortOptions: SORT_OPTIONS,
  };
};