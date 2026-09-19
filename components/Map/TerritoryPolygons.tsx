import React, { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { Polygon, Marker, PolygonPressEvent, Region } from 'react-native-maps';
import { View } from 'react-native';
import { getTerritoryStatus } from '~/utils/territoryStatus';
import { getPolygonCenter } from '~/utils/mapUtils';
import { Territory, Coordinate } from '~/types/Territory';
import { useTheme } from '~/context/ThemeContext';
import ThemedText from '../ThemedText';

const LABEL_BATCH_SIZE = 3;
const LABEL_BATCH_DELAY_MS = 40;
// Con más zoom-out que esto se ocultan los números de los territorios
const LABELS_MAX_LATITUDE_DELTA = 0.06;
// Margen extra alrededor de la pantalla (fracción del tamaño visible) para que
// los números ya estén dibujados cuando llegas a ellos
const VIEWPORT_BUFFER = 0.5;

type Bounds = { minLat: number; maxLat: number; minLng: number; maxLng: number };

const getBounds = (coordinates: Coordinate[] | undefined): Bounds | null => {
  if (!coordinates?.length) return null;
  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;
  for (const c of coordinates) {
    if (c.latitude < minLat) minLat = c.latitude;
    if (c.latitude > maxLat) maxLat = c.latitude;
    if (c.longitude < minLng) minLng = c.longitude;
    if (c.longitude > maxLng) maxLng = c.longitude;
  }
  return { minLat, maxLat, minLng, maxLng };
};

type TerritoryPolygonsProps = {
  territories: Territory[];
  selectedTerritory: Territory | null;
  onTerritoryPress: (territory: Territory) => void;
  isAddingHouse: boolean;
  onAddingHouse: (isAdding: boolean, coordinate: any) => void;
  // Región actual del mapa, fuera del estado de la pantalla para no re-renderizarla al mover el mapa
  subscribeRegion: (listener: () => void) => () => void;
  getRegion: () => Region | null;
  fallbackRegion: Region;
};

type LabelProps = {
  coordinate: Coordinate;
  number: number;
  dimmed: boolean;
};

// Un Marker con vista propia es lo más caro del mapa: cada uno se convierte en
// imagen nativa. Se deja de rastrear tras dibujarse (tracksViewChanges) y la
// opacidad va por la prop nativa `opacity`, que no obliga a redibujar la imagen.
const TerritoryLabel = React.memo(({ coordinate, number, dimmed }: LabelProps) => {
  const { isDark } = useTheme();
  const [tracksViewChanges, setTracksViewChanges] = useState(true);

  useEffect(() => {
    setTracksViewChanges(true);
    const timer = setTimeout(() => setTracksViewChanges(false), 500);
    return () => clearTimeout(timer);
  }, [number, isDark]);

  return (
    <Marker
      coordinate={coordinate}
      opacity={dimmed ? 0.5 : 1}
      tracksViewChanges={tracksViewChanges}>
      <View className="rounded-full bg-white px-1.5 py-0.5 dark:bg-black2">
        <ThemedText className="text-xs font-bold">{number}</ThemedText>
      </View>
    </Marker>
  );
});
TerritoryLabel.displayName = 'TerritoryLabel';

type ShapeProps = {
  territory: Territory;
  selected: boolean;
  dimmed: boolean;
  showLabel: boolean;
  isAddingHouse: boolean;
  onTerritoryPress: (territory: Territory) => void;
  onAddingHouse: (isAdding: boolean, coordinate: any) => void;
};

const TerritoryShape = React.memo(
  ({
    territory,
    selected,
    dimmed,
    showLabel,
    isAddingHouse,
    onTerritoryPress,
    onAddingHouse,
  }: ShapeProps) => {
    const colorHex = getTerritoryStatus(territory).colorHex;
    const center = useMemo(() => getPolygonCenter(territory.coordinates), [territory.coordinates]);

    const handlePress = useCallback(
      (e: PolygonPressEvent) => {
        if (!isAddingHouse) {
          onTerritoryPress(territory);
        } else {
          onAddingHouse(true, e.nativeEvent.coordinate);
        }
      },
      [isAddingHouse, onTerritoryPress, onAddingHouse, territory]
    );

    return (
      <>
        <Polygon
          coordinates={territory.coordinates}
          strokeColor={`${colorHex}${dimmed ? '40' : 'AA'}`}
          strokeWidth={selected ? 3 : 1}
          fillColor={`${colorHex}${dimmed ? '20' : '55'}`}
          tappable
          onPress={handlePress}
        />
        {showLabel && territory.coordinates?.length > 0 && (
          <TerritoryLabel coordinate={center} number={territory.number} dimmed={dimmed} />
        )}
      </>
    );
  }
);
TerritoryShape.displayName = 'TerritoryShape';

const TerritoryPolygonsComponent: React.FC<TerritoryPolygonsProps> = ({
  territories,
  selectedTerritory,
  onTerritoryPress,
  isAddingHouse,
  onAddingHouse,
  subscribeRegion,
  getRegion,
  fallbackRegion,
}) => {
  const selectedId = selectedTerritory?.id;
  const region = useSyncExternalStore(subscribeRegion, getRegion) ?? fallbackRegion;
  const showLabels = region.latitudeDelta <= LABELS_MAX_LATITUDE_DELTA;

  const bounds = useMemo(
    () => new Map(territories.map((t) => [t.id, getBounds(t.coordinates)])),
    [territories]
  );

  // Territorios en pantalla (más un margen); el seleccionado siempre
  const visibleIds = useMemo(() => {
    const latMargin = region.latitudeDelta * (0.5 + VIEWPORT_BUFFER);
    const lngMargin = region.longitudeDelta * (0.5 + VIEWPORT_BUFFER);
    const minLat = region.latitude - latMargin;
    const maxLat = region.latitude + latMargin;
    const minLng = region.longitude - lngMargin;
    const maxLng = region.longitude + lngMargin;

    const ids = new Set<string>();
    territories.forEach((t) => {
      const b = bounds.get(t.id);
      const inView =
        !!b && b.maxLat >= minLat && b.minLat <= maxLat && b.maxLng >= minLng && b.minLng <= maxLng;
      if (inView || t.id === selectedId) ids.add(t.id);
    });
    return ids;
  }, [territories, bounds, region, selectedId]);

  // Los números se montan por tandas y solo para lo visible; una vez puestos no
  // se quitan al mover el mapa (montar/desmontar marcadores es lo caro), solo
  // cuando te alejas del umbral de zoom.
  const [labeledIds, setLabeledIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    const toAdd = showLabels ? [...visibleIds].filter((id) => !labeledIds.has(id)) : [];
    const toRemove = showLabels ? [] : [...labeledIds];
    if (toAdd.length === 0 && toRemove.length === 0) return;

    const timer = setTimeout(() => {
      setLabeledIds((prev) => {
        const next = new Set(prev);
        toAdd.slice(0, LABEL_BATCH_SIZE).forEach((id) => next.add(id));
        toRemove.slice(0, LABEL_BATCH_SIZE).forEach((id) => next.delete(id));
        return next;
      });
    }, LABEL_BATCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [showLabels, visibleIds, labeledIds]);

  return (
    <>
      {territories.map((territory) => {
        const selected = selectedId === territory.id;
        return (
          <TerritoryShape
            key={territory.id}
            territory={territory}
            selected={selected}
            dimmed={!!selectedId && !selected}
            showLabel={labeledIds.has(territory.id)}
            isAddingHouse={isAddingHouse}
            onTerritoryPress={onTerritoryPress}
            onAddingHouse={onAddingHouse}
          />
        );
      })}
    </>
  );
};

const TerritoryPolygons = React.memo(TerritoryPolygonsComponent);
TerritoryPolygons.displayName = 'TerritoryPolygons';

export default TerritoryPolygons;
