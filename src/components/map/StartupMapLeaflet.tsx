"use client";

import "leaflet/dist/leaflet.css";
import "react-leaflet-cluster/dist/assets/MarkerCluster.css";
import "react-leaflet-cluster/dist/assets/MarkerCluster.Default.css";
import "../startup-map.css";

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  LatLngBoundsExpression,
  LatLngExpression,
  MarkerClusterGroupOptions,
} from "leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  ZoomControl,
} from "react-leaflet";
import { CompanyMapPopup } from "@/components/investor/CompanyMapPopup";
import { MapChromePortalLeaflet } from "@/components/map/MapChromePortalLeaflet";
import { MapDetailsPanel } from "@/components/map/MapDetailsPanel";
import { MapLayoutSyncLeaflet } from "@/components/map/MapLayoutSyncLeaflet";
import { MeasureDistanceToolLeaflet } from "@/components/map/MeasureToolLeaflet";
import type { StartupMapProps } from "@/components/map/startupMapTypes";
import { findSimilarCompanies } from "@/lib/investor/similarCompanies";
import type { Company } from "@/lib/map-config";
import { MAP_LAYER_OPTIONS, type MapLayerId } from "@/lib/map/mapLayers";
import { getStartupMarkerIcon } from "@/lib/map/markerIcon";

const UTAH_BOUNDS: LatLngBoundsExpression = [
  [36.95, -114.07],
  [42.05, -109.0],
];

const INITIAL_CENTER: LatLngExpression = [40.4555, -111.65];
const INITIAL_ZOOM = 8;
const DISABLE_CLUSTER_ZOOM = 14;
const FOCUS_MIN_ZOOM = DISABLE_CLUSTER_ZOOM;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function clusterBrandIcon(cluster: any) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const L = require("leaflet");
  const count = cluster.getChildCount();
  let size = 42;
  if (count >= 35) size = 52;
  else if (count >= 18) size = 48;

  let fontSize = 14;
  if (count >= 100) fontSize = 13;

  const html = `<div class="cluster-pin"><span class="cluster-pin__count" style="font-size:${fontSize}px">${count}</span></div>`;

  return L.divIcon({
    html,
    className: "cluster-pin-wrapper",
    iconSize: L.point(size, size),
    iconAnchor: [size / 2, size / 2],
  });
}

function ActiveTileLayer({ layerId }: { layerId: MapLayerId }) {
  const opt =
    MAP_LAYER_OPTIONS.find((o) => o.id === layerId && o.enabled) ??
    MAP_LAYER_OPTIONS[0]!;
  return (
    <TileLayer
      key={opt.id}
      url={opt.url}
      attribution={opt.attribution}
      maxZoom={opt.maxZoom ?? 19}
      {...(opt.subdomains ? { subdomains: opt.subdomains } : {})}
    />
  );
}

function MapZoomMarkerScale() {
  const map = useMap();

  useEffect(() => {
    const clamp = (v: number, lo: number, hi: number) =>
      Math.min(hi, Math.max(lo, v));
    const apply = () => {
      const z = map.getZoom();
      const scale = clamp(0.78 + (z - 6) * 0.048, 0.72, 1.28);
      map.getContainer().style.setProperty(
        "--startup-marker-zoom-scale",
        String(scale),
      );
    };
    apply();
    map.on("zoom zoomend", apply);
    return () => {
      map.off("zoom zoomend", apply);
    };
  }, [map]);

  return null;
}

function FocusFlyTo({
  companies,
  focusedId,
}: {
  companies: Company[];
  focusedId: string | null;
}) {
  const map = useMap();
  const lastFocused = useRef<string | null>(null);

  useEffect(() => {
    if (!focusedId || focusedId === lastFocused.current) return;
    const target = companies.find((c) => c.id === focusedId);
    if (!target) return;
    lastFocused.current = focusedId;
    map.flyTo([target.lat, target.lng], Math.max(map.getZoom(), FOCUS_MIN_ZOOM), {
      duration: 0.85,
      easeLinearity: 0.4,
    });
  }, [focusedId, companies, map]);

  return null;
}

function StartupMapLeafletInner({
  companies,
  allCompanies,
  focusedId,
  onMarkerClick,
  inWatchlist,
  onToggleWatchlist,
  compareIds = [],
  onToggleCompare,
  getClaimStatus,
  onClaimCompany,
  mapLayoutRevision = 0,
  mapChrome,
  mapViewMode,
  onMapViewModeChange,
}: StartupMapProps) {
  const [layerId, setLayerId] = useState<MapLayerId>("default");
  const [measureActive, setMeasureActive] = useState(false);

  const clusterOptions = useMemo(
    (): MarkerClusterGroupOptions => ({
      chunkedLoading: true,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      maxClusterRadius: 55,
      disableClusteringAtZoom: DISABLE_CLUSTER_ZOOM,
      zoomToBoundsOnClick: true,
      iconCreateFunction: clusterBrandIcon,
    }),
    [],
  );

  return (
    <>
      <MapLayoutSyncLeaflet revision={mapLayoutRevision} />
      <MapZoomMarkerScale />
      <ActiveTileLayer layerId={layerId} />
      <MeasureDistanceToolLeaflet
        key={measureActive ? "measure-on" : "measure-off"}
        active={measureActive}
      />
      {mapChrome ? (
        <MapChromePortalLeaflet>{mapChrome}</MapChromePortalLeaflet>
      ) : null}
      <MapDetailsPanel
        activeLayerId={layerId}
        onLayerChange={setLayerId}
        measureActive={measureActive}
        onMeasureToggle={() => {
          setMeasureActive((v) => {
            const next = !v;
            return next;
          });
        }}
        mapViewMode={mapViewMode}
        onMapViewModeChange={onMapViewModeChange}
      />
      <MarkerClusterGroup {...clusterOptions}>
        {companies.map((c) => {
          const focused = c.id === focusedId;
          const claimStatus = getClaimStatus?.(c.id) ?? "unclaimed";
          const wl = inWatchlist?.(c) ?? false;
          const cmpSel = compareIds.includes(c.id);
          const cmpDisabled =
            Boolean(onToggleCompare) && !cmpSel && compareIds.length >= 3;
          const similar = findSimilarCompanies(c, allCompanies, 3);

          return (
            <Marker
              key={c.id}
              position={[c.lat, c.lng]}
              icon={getStartupMarkerIcon(c, { focused, saved: wl })}
              zIndexOffset={focused ? 1000 : wl ? 400 : 0}
              eventHandlers={{
                click: () => onMarkerClick?.(c.id),
              }}
            >
              <Popup
                minWidth={260}
                maxWidth={320}
                className="startup-popup"
                autoPan
                autoPanPadding={[20, 20]}
                autoPanPaddingTopLeft={[24, 100]}
                autoPanPaddingBottomRight={[24, 120]}
                keepInView
              >
                <CompanyMapPopup
                  company={c}
                  similar={similar}
                  inWatchlist={wl}
                  onToggleWatchlist={() => onToggleWatchlist?.(c)}
                  compareSelected={cmpSel}
                  compareDisabled={cmpDisabled}
                  onToggleCompare={() => onToggleCompare?.(c)}
                  claimStatus={claimStatus}
                  onClaimClick={() => onClaimCompany?.(c)}
                />
              </Popup>
            </Marker>
          );
        })}
      </MarkerClusterGroup>
      <FocusFlyTo companies={companies} focusedId={focusedId} />
    </>
  );
}

export function StartupMapLeaflet(props: StartupMapProps) {
  return (
    <MapContainer
      center={INITIAL_CENTER}
      zoom={INITIAL_ZOOM}
      minZoom={6}
      maxZoom={17}
      maxBounds={UTAH_BOUNDS}
      maxBoundsViscosity={0.85}
      scrollWheelZoom
      className="relative z-0 h-full w-full min-h-0 bg-surface-tint"
      attributionControl
      worldCopyJump={false}
      zoomControl={false}
    >
      <ZoomControl position="bottomleft" />
      <StartupMapLeafletInner {...props} />
    </MapContainer>
  );
}
