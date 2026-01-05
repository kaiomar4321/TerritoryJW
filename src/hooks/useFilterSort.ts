import { useMemo, useState } from 'react';
import { Territory } from '~/types/Territory';
import { FilterOption } from '~/types/FilterOption';
import { getTerritoryStatus } from '~/utils/territoryStatus';

export type SortOption = 'recent' | 'oldest' | 'ascNumber' | 'descNumber' | null;

export const useFilterSort = (territories: Territory[]) => {
  const [filterOption, setFilterOption] = useState<FilterOption | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);

  const filteredAndSortedTerritories = useMemo(() => {
    let filtered = territories.filter((t) => {
      const query = searchQuery.toLowerCase().trim();
      if (!query) return true;
      return t.name.toLowerCase().includes(query) || t.number.toString().includes(query);
    });

    if (filterOption) filtered = filtered.filter((t) => getTerritoryStatus(t).id === filterOption);

    if (sortOption === 'recent')
      filtered = filtered.sort(
        (a, b) =>
          (b.visitStartDate ? new Date(b.visitStartDate).getTime() : 0) -
          (a.visitStartDate ? new Date(a.visitStartDate).getTime() : 0)
      );
    if (sortOption === 'oldest')
      filtered = filtered.sort(
        (a, b) =>
          (a.visitStartDate ? new Date(a.visitStartDate).getTime() : 0) -
          (b.visitStartDate ? new Date(b.visitStartDate).getTime() : 0)
      );
    if (sortOption === 'ascNumber') filtered = filtered.sort((a, b) => a.number - b.number);
    if (sortOption === 'descNumber') filtered = filtered.sort((a, b) => b.number - a.number);

    return filtered;
  }, [territories, filterOption, sortOption, searchQuery]);

  return {
    filterOption,
    setFilterOption,
    sortOption,
    setSortOption,
    searchQuery,
    setSearchQuery,
    bottomSheetOpen,
    setBottomSheetOpen,
    filteredAndSortedTerritories,
  };
};
