"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import "../startup-map.css";

import type { Feature, Point } from "geojson";
import type { MapLayerMouseEvent } from "maplibre-gl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import MapGL, {
  AttributionControl,
  Layer,
  Marker,
  NavigationControl,
  Popup,
  Source,
  type MapRef,
} from "react-map-gl/maplibre";
import Supercluster from "supercluster";
import { CompanyMapPopup } from "@/components/investor/CompanyMapPopup";
import { MapChromePortal } from "@/components/map/MapChromePortal";
import { MapDetailsPanel } from "@/components/map/MapDetailsPanel";
import { MapLayoutSync } from "@/components/map/MapLayoutSync";
import { MeasureDistanceTool } from "@/components/map/MeasureTool";
import { StartupMarkerPin } from "@/components/map/StartupMarkerPin";
import type { StartupMapProps } from "@/components/map/startupMapTypes";
import { findSimilarCompanies } from "@/lib/investor/similarCompanies";
import { buildCompanyExtrusionCollection } from "@/lib/map/companyExtrusionGeoJSON";
import { pathLengthKm } from "@/lib/map/distance";
import {
  buildMaplibreBaseStyle,
  syncBasemapTiles,
} from "@/lib/map/maplibreBaseStyle";
import type { MapLayerId } from "@/lib/map/mapLayers";

const UTAH_BOUNDS: [[number, number], [number, number]] = [
  [-114.07, 36.95],
  [-109.0, 42.05],
];

const INITIAL_VIEW = {
  longitude: -111.65,
  latitude: 40.4555,
  zoom: 8,
  pitch: 42,
  bearing: -14,
  padding: { top: 0, bottom: 0, left: 0, right: 0 } as const,
};

const FOCUS_MIN_ZOOM = 14;
const CLUSTER_MAX_Z = 13;
const EXTRUSION_MIN_ZOOM = 13;

const baseGlStyle = buildMaplibreBaseStyle("default");

export function StartupMapMapLibre({
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
  const mapRef = useRef<MapRef>(null);
  const [layerId, setLayerId] = useState<MapLayerId>("default");
  const [measureActive, setMeasureActive] = useState(false);
  const [measurePts, setMeasurePts] = useState<[number, number][]>([]);
  const [popupId, setPopupId] = useState<string | null>(null);
  const [clusters, setClusters] = useState<
    Feature<Point, Record<string, unknown>>[]
  >([]);
  const [mapReady, setMapReady] = useState(false);
  const [mapContainerEl, setMapContainerEl] = useState<HTMLElement | null>(
    null,
  );
  const lastFocused = useRef<string | null>(null);

  const clusterIndex = useMemo(() => {
    const sc = new Supercluster({
      radius: 55,
      maxZoom: CLUSTER_MAX_Z,
      minPoints: 2,
    });
    const points: Feature<Point, { companyId: string }>[] = companies.map(
      (c) => ({
        type: "Feature",
        properties: { companyId: c.id },
        geometry: { type: "Point", coordinates: [c.lng, c.lat] },
      }),
    );
    sc.load(points);
    return sc;
  }, [companies]);

  const companyById = useMemo(
    () => new Map(companies.map((c) => [c.id, c])),
    [companies],
  );

  const extrusionData = useMemo(
    () => buildCompanyExtrusionCollection(companies),
    [companies],
  );

  const measureGeo = useMemo(() => {
    if (measurePts.length < 2) {
      return { type: "FeatureCollection" as const, features: [] };
    }
    return {
      type: "FeatureCollection" as const,
      features: [
        {
          type: "Feature" as const,
          properties: {},
          geometry: {
            type: "LineString" as const,
            coordinates: measurePts,
          },
        },
      ],
    };
  }, [measurePts]);

  const measureKm = useMemo(() => {
    if (measurePts.length < 2) return 0;
    const flat = measurePts.map(([lng, lat]) => ({ lat, lng }));
    return pathLengthKm(flat);
  }, [measurePts]);

  const refreshClusters = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    const b = map.getBounds();
    const z = Math.floor(map.getZoom());
    const bbox: [number, number, number, number] = [
      b.getWest(),
      b.getSouth(),
      b.getEast(),
      b.getNorth(),
    ];
    setClusters(
      clusterIndex.getClusters(bbox, z) as Feature<
        Point,
        Record<string, unknown>
      >[],
    );
  }, [clusterIndex]);

  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map?.isStyleLoaded()) return;
    syncBasemapTiles(map, layerId);
  }, [layerId]);

  useEffect(() => {
    if (!focusedId || focusedId === lastFocused.current) return;
    const target = companies.find((c) => c.id === focusedId);
    if (!target) return;
    lastFocused.current = focusedId;
    const map = mapRef.current?.getMap();
    if (!map) return;
    map.flyTo({
      center: [target.lng, target.lat],
      zoom: Math.max(map.getZoom(), FOCUS_MIN_ZOOM),
      duration: 850,
      essential: true,
    });
  }, [focusedId, companies]);

  const handleLoad = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (map) {
      syncBasemapTiles(map, layerId);
      setMapContainerEl(map.getContainer());
    }
    refreshClusters();
    setMapReady(true);
  }, [layerId, refreshClusters]);

  const handleMapClick = useCallback(
    (e: MapLayerMouseEvent) => {
      if (!measureActive) return;
      const { lng, lat } = e.lngLat;
      setMeasurePts((p) => [...p, [lng, lat]]);
    },
    [measureActive],
  );

  useEffect(() => {
    const esc = (ev: KeyboardEvent) => {
      if (ev.key === "Escape" && measureActive) setMeasurePts([]);
    };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [measureActive]);

  const openPopupFor = useCallback(
    (id: string) => {
      setPopupId(id);
      onMarkerClick?.(id);
    },
    [onMarkerClick],
  );

  const handleClusterClick = useCallback(
    (clusterId: number, lng: number, lat: number) => {
      const map = mapRef.current?.getMap();
      if (!map) return;
      const z = clusterIndex.getClusterExpansionZoom(clusterId);
      map.easeTo({
        center: [lng, lat],
        zoom: Math.min(z + 0.15, map.getMaxZoom() ?? 17),
        duration: 420,
      });
    },
    [clusterIndex],
  );

  return (
    <div className="startup-maplibre relative z-0 h-full w-full min-h-0 bg-surface-tint">
      <MapGL
        ref={mapRef}
        mapStyle={baseGlStyle}
        initialViewState={INITIAL_VIEW}
        maxBounds={UTAH_BOUNDS}
        minZoom={6}
        maxZoom={17}
        maxPitch={60}
        dragRotate
        touchPitch
        pitchWithRotate
        style={{ width: "100%", height: "100%" }}
        onLoad={handleLoad}
        onClick={handleMapClick}
        onMoveEnd={refreshClusters}
        onZoomEnd={refreshClusters}
      >
        <NavigationControl position="bottom-left" showCompass showZoom />
        <AttributionControl position="bottom-right" compact />
        <MapLayoutSync mapRef={mapRef} revision={mapLayoutRevision} />
        <Source id="startups-extrude" type="geojson" data={extrusionData}>
          <Layer
            id="startups-columns"
            type="fill-extrusion"
            minzoom={EXTRUSION_MIN_ZOOM}
            paint={{
              "fill-extrusion-height": ["get", "heightM"],
              "fill-extrusion-base": 0,
              "fill-extrusion-color": ["get", "color"],
              "fill-extrusion-opacity": 0.82,
              "fill-extrusion-vertical-gradient": true,
            }}
          />
        </Source>
        {measureActive && measureGeo.features.length > 0 ? (
          <Source id="measure-line" type="geojson" data={measureGeo}>
            <Layer
              id="measure-line-layer"
              type="line"
              paint={{
                "line-color": "#d4af37",
                "line-width": 3,
                "line-opacity": 0.9,
              }}
            />
          </Source>
        ) : null}
        <MeasureDistanceTool
          active={measureActive}
          portalTarget={mapContainerEl}
          km={measureKm}
          pointCount={measurePts.length}
        />
        {mapChrome ? (
          <MapChromePortal mapRef={mapRef} mapReady={mapReady}>
            {mapChrome}
          </MapChromePortal>
        ) : null}
        <MapDetailsPanel
          activeLayerId={layerId}
          onLayerChange={setLayerId}
          measureActive={measureActive}
          onMeasureToggle={() => {
            setMeasureActive((v) => {
              const next = !v;
              if (!next) setMeasurePts([]);
              return next;
            });
          }}
          mapViewMode={mapViewMode}
          onMapViewModeChange={onMapViewModeChange}
        />
        {clusters.map((f) => {
          const coords = f.geometry.coordinates;
          const [lng, lat] = coords;
          const props = f.properties as {
            cluster?: boolean;
            cluster_id?: number;
            point_count?: number;
            companyId?: string;
          };

          if (props.cluster && props.cluster_id !== undefined) {
            const count = props.point_count ?? 0;
            let size = 42;
            if (count >= 35) size = 52;
            else if (count >= 18) size = 48;
            let fontSize = 14;
            if (count >= 100) fontSize = 13;
            return (
              <Marker
                key={`c-${props.cluster_id}`}
                longitude={lng}
                latitude={lat}
                anchor="center"
              >
                <button
                  type="button"
                  className="cluster-pin-wrapper"
                  style={{ width: size, height: size }}
                  aria-label={`${count} companies`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClusterClick(props.cluster_id!, lng, lat);
                  }}
                >
                  <div className="cluster-pin">
                    <span
                      className="cluster-pin__count"
                      style={{ fontSize: `${fontSize}px` }}
                    >
                      {count}
                    </span>
                  </div>
                </button>
              </Marker>
            );
          }

          const cid = props.companyId;
          if (!cid) return null;
          const c = companyById.get(cid);
          if (!c) return null;
          const focused = c.id === focusedId;
          const wl = inWatchlist?.(c) ?? false;

          return (
            <Marker
              key={c.id}
              longitude={lng}
              latitude={lat}
              anchor="bottom"
              style={{ zIndex: focused ? 4 : wl ? 2 : 1 }}
            >
              <div
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") openPopupFor(c.id);
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  openPopupFor(c.id);
                }}
              >
                <StartupMarkerPin company={c} focused={focused} saved={wl} />
              </div>
            </Marker>
          );
        })}
        {popupId
          ? (() => {
              const c = companyById.get(popupId);
              if (!c) return null;
              const wl = inWatchlist?.(c) ?? false;
              const claimStatus = getClaimStatus?.(c.id) ?? "unclaimed";
              const cmpSel = compareIds.includes(c.id);
              const cmpDisabled =
                Boolean(onToggleCompare) && !cmpSel && compareIds.length >= 3;
              const similar = findSimilarCompanies(c, allCompanies, 3);
              return (
                <Popup
                  key={popupId}
                  longitude={c.lng}
                  latitude={c.lat}
                  anchor="bottom"
                  onClose={() => setPopupId(null)}
                  maxWidth="320px"
                  className="startup-maplibre-popup"
                  closeOnClick={false}
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
              );
            })()
          : null}
      </MapGL>
    </div>
  );
}
