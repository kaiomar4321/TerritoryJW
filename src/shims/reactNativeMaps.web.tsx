// Adaptador SOLO WEB: imita la parte de react-native-maps que usa la app
// (MapView, Marker, Polygon) sobre Google Maps JS. Metro lo enchufa en lugar de
// 'react-native-maps' cuando la plataforma es web (ver metro.config.js), así las
// pantallas no cambian. Solo implementa las props que la app realmente usa.
import React, { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { StyleProp, Text, View, ViewStyle } from 'react-native';
import {
  AdvancedMarker,
  APIProvider,
  Map as GoogleMap,
  Pin,
  Polygon as GooglePolygon,
  useMap,
} from '@vis.gl/react-google-maps';

const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_WEB_API_KEY;
// AdvancedMarker exige un Map ID. DEMO_MAP_ID sirve para desarrollo; para un
// estilo propio crea uno en Google Cloud > Map Management y ponlo en el .env.
const MAP_ID = process.env.EXPO_PUBLIC_GOOGLE_MAPS_WEB_MAP_ID || 'DEMO_MAP_ID';

type LatLng = { latitude: number; longitude: number };
type Region = LatLng & { latitudeDelta: number; longitudeDelta: number };
type PressEvent = { nativeEvent: { coordinate: LatLng } };
type Bounds = { north: number; south: number; east: number; west: number };

const toLiteral = (c: LatLng) => ({ lat: c.latitude, lng: c.longitude });
const toPressEvent = (lat: number, lng: number): PressEvent => ({
  nativeEvent: { coordinate: { latitude: lat, longitude: lng } },
});
const regionToBounds = (r: Region): Bounds => ({
  north: r.latitude + r.latitudeDelta / 2,
  south: r.latitude - r.latitudeDelta / 2,
  east: r.longitude + r.longitudeDelta / 2,
  west: r.longitude - r.longitudeDelta / 2,
});

// Google separa color y opacidad; la app usa '#RRGGBBAA' y 'rgba(r,g,b,a)'
const parseColor = (value?: string): { color?: string; opacity: number } => {
  if (!value) return { color: undefined, opacity: 1 };

  const hex = /^#([0-9a-f]{6})([0-9a-f]{2})?$/i.exec(value);
  if (hex) return { color: `#${hex[1]}`, opacity: hex[2] ? parseInt(hex[2], 16) / 255 : 1 };

  const rgba = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/i.exec(value);
  if (rgba) {
    const [r, g, b] = [rgba[1], rgba[2], rgba[3]].map((n) => Number(n).toString(16).padStart(2, '0'));
    return { color: `#${r}${g}${b}`, opacity: rgba[4] !== undefined ? Number(rgba[4]) : 1 };
  }

  return { color: value, opacity: 1 };
};

// ---------- Polygon ----------

type PolygonProps = {
  coordinates: LatLng[];
  strokeColor?: string;
  strokeWidth?: number;
  fillColor?: string;
  tappable?: boolean;
  onPress?: (e: PressEvent) => void;
};

export const Polygon = ({
  coordinates,
  strokeColor,
  strokeWidth = 1,
  fillColor,
  tappable,
  onPress,
}: PolygonProps) => {
  const paths = useMemo(() => coordinates.map(toLiteral), [coordinates]);
  const stroke = parseColor(strokeColor);
  const fill = parseColor(fillColor);

  return (
    <GooglePolygon
      paths={paths}
      strokeColor={stroke.color}
      strokeOpacity={stroke.opacity}
      strokeWeight={strokeWidth}
      fillColor={fill.color}
      fillOpacity={fill.opacity}
      clickable={!!tappable}
      onClick={(e) => {
        if (e.latLng) onPress?.(toPressEvent(e.latLng.lat(), e.latLng.lng()));
      }}
    />
  );
};

// ---------- Marker ----------

type MarkerProps = {
  coordinate: LatLng;
  pinColor?: string;
  draggable?: boolean;
  opacity?: number;
  title?: string;
  onPress?: () => void;
  onDragEnd?: (e: PressEvent) => void;
  children?: React.ReactNode;
};

export const Marker = ({
  coordinate,
  pinColor,
  draggable,
  opacity,
  title,
  onPress,
  onDragEnd,
  children,
}: MarkerProps) => {
  const interactive = !!draggable || !!onPress;

  return (
    <AdvancedMarker
      position={toLiteral(coordinate)}
      title={title}
      draggable={draggable}
      clickable={!!onPress}
      onClick={() => onPress?.()}
      onDragEnd={(e) => {
        if (e.latLng) onDragEnd?.(toPressEvent(e.latLng.lat(), e.latLng.lng()));
      }}
      // Con vista propia (los números de territorio) se centra sobre el punto;
      // el pin por defecto apunta con la punta
      anchorLeft={children ? '-50%' : undefined}
      anchorTop={children ? '-50%' : undefined}
      // Lo que no es interactivo no debe tapar los clics del polígono de abajo
      style={{ opacity, pointerEvents: interactive ? 'auto' : 'none' }}>
      {children ?? <Pin background={pinColor} glyphColor="#ffffff" />}
    </AdvancedMarker>
  );
};

// ---------- MapView ----------

export type MapHandle = {
  animateToRegion: (region: Region, duration?: number) => void;
};

// Vive dentro del mapa para poder usar su instancia y exponer la API por ref
const MapController = forwardRef<MapHandle>(function MapController(_, ref) {
  const map = useMap();
  useImperativeHandle(
    ref,
    () => ({
      animateToRegion: (region) => {
        map?.fitBounds(regionToBounds(region), 0);
      },
    }),
    [map]
  );
  return null;
});

type MapViewProps = {
  style?: StyleProp<ViewStyle>;
  initialRegion: Region;
  userInterfaceStyle?: 'light' | 'dark';
  onRegionChangeComplete?: (region: Region) => void;
  onPress?: (e: PressEvent) => void;
  children?: React.ReactNode;
  // provider, customMapStyle, removeClippedSubviews... no aplican en web: se ignoran
};

const MapView = forwardRef<MapHandle, MapViewProps>(function MapView(
  { style, initialRegion, userInterfaceStyle, onRegionChangeComplete, onPress, children },
  ref
) {
  // Última zona vista: si el mapa se recrea (cambio de tema) vuelve a donde estaba
  const lastBounds = useRef<Bounds>(regionToBounds(initialRegion));

  if (!API_KEY) {
    return (
      <View style={[{ alignItems: 'center', justifyContent: 'center', padding: 16 }, style]}>
        <Text>Falta EXPO_PUBLIC_GOOGLE_MAPS_WEB_API_KEY en el .env</Text>
      </View>
    );
  }

  const scheme = userInterfaceStyle === 'dark' ? 'DARK' : 'LIGHT';

  return (
    <View style={style}>
      <APIProvider apiKey={API_KEY} language="es">
        <GoogleMap
          // El esquema de color solo se lee al crear el mapa: se recrea al cambiar
          key={scheme}
          mapId={MAP_ID}
          colorScheme={scheme}
          defaultBounds={lastBounds.current}
          gestureHandling="greedy"
          disableDefaultUI
          zoomControl
          clickableIcons={false}
          onClick={(e) => {
            const p = e.detail.latLng;
            if (p) onPress?.(toPressEvent(p.lat, p.lng));
          }}
          onIdle={(e) => {
            const bounds = e.map.getBounds();
            const center = e.map.getCenter();
            if (!bounds || !center) return;
            const ne = bounds.getNorthEast();
            const sw = bounds.getSouthWest();
            lastBounds.current = { north: ne.lat(), south: sw.lat(), east: ne.lng(), west: sw.lng() };
            onRegionChangeComplete?.({
              latitude: center.lat(),
              longitude: center.lng(),
              latitudeDelta: ne.lat() - sw.lat(),
              longitudeDelta: ne.lng() - sw.lng(),
            });
          }}>
          <MapController ref={ref} />
          {children}
        </GoogleMap>
      </APIProvider>
    </View>
  );
});

export default MapView;
export const PROVIDER_GOOGLE = 'google';
