import React from 'react';
import {
  ScrollView,
  Text,
  View,
  useColorScheme,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useReport } from '~/hooks/useReport';
import { Territory } from '~/types/Territory';
import { formatDate } from '~/services/reportService';
import { styles } from 'components/styles';

// ─── component ───────────────────────────────────────────────────────────────

export default function TerritoryReport() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { completedTerritories, leaderNameByGroupId, stats, sortKey, setSortKey, isLoading, error, handleGeneratePDF, isGeneratingPDF, sortOptions } = useReport();

  // ── loading / error states ──
  if (isLoading)
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-gray-100 dark:bg-black2">
        <ActivityIndicator size="large" color={isDark ? '#9CA3AF' : '#3b82f6'} />
        <Text className="mt-4 text-gray-900 dark:text-gray-100">Cargando reporte...</Text>
      </SafeAreaView>
    );

  if (error)
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-gray-100 dark:bg-black2">
        <Text className="text-gray-900 dark:text-gray-100">Error: {error.message}</Text>
      </SafeAreaView>
    );

  // ── main render ──
  return (
    <SafeAreaView className={styles.SAV}>
      {/* ── Header ── */}
      <View className={styles.containerPage}>
        <View className="flex-row items-center justify-between">
          <Text className={styles.pageTitle}>Reporte</Text>
          <TouchableOpacity
            onPress={handleGeneratePDF}
            disabled={isGeneratingPDF}
            className="rounded-xl bg-purple-100 px-3 py-2 dark:bg-purple-900/40">
            <View className="flex-row items-center gap-1">
              {isGeneratingPDF ? (
                <ActivityIndicator
                  size="small"
                  color={isDark ? '#c4b5fd' : '#7c3aed'}
                />
              ) : (
                <Ionicons
                  name="document-text-outline"
                  size={18}
                  color={isDark ? '#c4b5fd' : '#7c3aed'}
                />
              )}
              <Text className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                {isGeneratingPDF ? 'Generando...' : 'PDF'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 12 }} showsVerticalScrollIndicator={false}>

        {/* ── Stats summary ── */}
        <View className="mb-4 flex-row gap-2">
          <StatCard label="Total" value={stats.total} color="#6b7280" isDark={isDark} />
          <StatCard label="Listos" value={stats.ready} color="#3b82f6" isDark={isDark} />
          <StatCard label="En curso" value={stats.incomplete} color="#eab308" isDark={isDark} />
          <StatCard label="Terminados" value={stats.completed} color="#22c55e" isDark={isDark} />
        </View>

        {/* ── Sort bar ── */}
        <View className="mb-3 flex-row items-center gap-2">
          <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400">Ordenar:</Text>
          {sortOptions.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              onPress={() => setSortKey(opt.key)}
              className={`rounded-full px-3 py-1 ${
                sortKey === opt.key
                  ? 'bg-purple-600'
                  : 'bg-white dark:bg-black3'
              }`}>
              <Text
                className={`text-xs font-semibold ${
                  sortKey === opt.key ? 'text-white' : 'text-gray-600 dark:text-gray-400'
                }`}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Section title ── */}
        <Text className="mb-2 text-base font-bold text-gray-700 dark:text-gray-200">
          Territorios completados ({completedTerritories.length})
        </Text>

        {/* ── List ── */}
        {completedTerritories.length === 0 ? (
          <View className="items-center justify-center py-16">
            <Ionicons
              name="checkmark-done-circle-outline"
              size={56}
              color={isDark ? '#4b5563' : '#d1d5db'}
            />
            <Text className="mt-3 text-center text-base text-gray-400 dark:text-gray-500">
              Ningún territorio completado todavía
            </Text>
          </View>
        ) : (
          completedTerritories.map((territory, index) => (
            <TerritoryReportRow
              key={territory.id}
              territory={territory}
              index={index}
              isDark={isDark}
              leaderName={leaderNameByGroupId.get(territory.groupId || '') || '—'}
            />
          ))
        )}

        <View className="h-6" />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── sub-components ──────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  color,
  isDark,
}: {
  label: string;
  value: number;
  color: string;
  isDark: boolean;
}) {
  return (
    <View
      className="flex-1 items-center rounded-2xl bg-white py-3 shadow-sm dark:bg-black3"
      style={{ borderTopWidth: 3, borderTopColor: color }}>
      <Text className="text-xl font-bold text-gray-900 dark:text-white">{value}</Text>
      <Text className="text-xs text-gray-500 dark:text-gray-400">{label}</Text>
    </View>
  );
}

function TerritoryReportRow({
  territory,
  index,
  isDark,
  leaderName,
}: {
  territory: Territory;
  index: number;
  isDark: boolean;
  leaderName: string;
}) {
  return (
    <View className="mb-3 overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-black3">
      {/* ── left badge + content row ── */}
      <View className="flex-row">
        {/* Number badge */}
        <View className="w-20 items-center justify-center bg-green-500 py-4">
          <Text className="text-2xl font-bold text-white">{territory.number}</Text>
          <Text className="text-xs font-medium text-green-100">T-{territory.number}</Text>
        </View>

        {/* Content */}
        <View className="flex-1 px-3 py-3">
          <Text className="text-base font-semibold text-gray-900 dark:text-white" numberOfLines={1}>
            {territory.name}
          </Text>

          {/* Dates */}
          <View className="mt-2 gap-1">
            <View className="flex-row items-center gap-1">
              <Ionicons
                name="play-circle-outline"
                size={14}
                color={isDark ? '#9ca3af' : '#6b7280'}
              />
              <Text className="text-xs text-gray-500 dark:text-gray-400">
                Inicio:{' '}
                <Text className="font-medium text-gray-700 dark:text-gray-200">
                  {formatDate(territory.visitStartDate)}
                </Text>
              </Text>
            </View>

            <View className="flex-row items-center gap-1">
              <Ionicons
                name="checkmark-circle-outline"
                size={14}
                color="#22c55e"
              />
              <Text className="text-xs text-gray-500 dark:text-gray-400">
                Completado:{' '}
                <Text className="font-semibold text-green-600 dark:text-green-400">
                  {formatDate(territory.visitEndDate)}
                </Text>
              </Text>
            </View>

            <View className="flex-row items-center gap-1">
              <Ionicons
                name="person-outline"
                size={14}
                color={isDark ? '#9ca3af' : '#6b7280'}
              />
              <Text className="text-xs text-gray-500 dark:text-gray-400">
                Encargado:{' '}
                <Text className="font-medium text-gray-700 dark:text-gray-200">
                  {leaderName}
                </Text>
              </Text>
            </View>
          </View>

          {/* Note (optional) */}
          {!!territory.note && (
            <View className="mt-2 rounded-md bg-slate-100 px-2 py-1 dark:bg-black2">
              <Text className="text-xs text-gray-500 dark:text-gray-400" numberOfLines={2}>
                📝 {territory.note}
              </Text>
            </View>
          )}
        </View>

        {/* Index chip */}
        <View className="items-center justify-start px-2 pt-3">
          <Text className="text-xs text-gray-300 dark:text-gray-600">#{index + 1}</Text>
        </View>
      </View>
    </View>
  );
}
