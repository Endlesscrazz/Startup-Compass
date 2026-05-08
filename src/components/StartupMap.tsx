"use client";

import "leaflet/dist/leaflet.css";
import "./startup-map.css";

import { useEffect, useRef } from "react";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { type Company, getSectorColor } from "@/lib/map-config";

// Utah bounding box — keeps the map focused on the state and prevents users
// from drifting off into the ocean.
const UTAH_BOUNDS: L.LatLngBoundsExpression = [
  [36.95, -114.07], // SW (corner of NV/AZ)
  [42.05, -109.0], // NE (corner of WY/CO)
];

const INITIAL_CENTER: L.LatLngExpression = [40.4555, -111.65];
const INITIAL_ZOOM = 8;

/**
 * Builds an SVG-based DivIcon for each marker.
 * Memoized per color so we don't allocate icons for every render of every dot.
 */
const iconCache = new Map<string, L.DivIcon>();
function getMarkerIcon(color: string, isFocused = false): L.DivIcon {
  const key = `${color}::${isFocused ? "focused" : "rest"}`;
  const cached = iconCache.get(key);
  if (cached) return cached;

  const ringColor = isFocused ? color : "rgba(11, 27, 51, 0.18)";
  const ringWidth = isFocused ? 3 : 2;
  const size = isFocused ? 18 : 14;
  const halo = isFocused
    ? `<circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 0.5}" fill="${color}" opacity="0.18"/>`
    : "";

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      ${halo}
      <circle cx="${size / 2}" cy="${size / 2}" r="${(size - ringWidth) / 2 - 1}"
        fill="${color}" stroke="${ringColor}" stroke-width="${ringWidth}" />
    </svg>
  `;

  const icon = L.divIcon({
    html: svg,
    className: "startup-marker",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 + 1],
  });
  iconCache.set(key, icon);
  return icon;
}

type Props = {
  companies: Company[];
  /** When set, the map smoothly flies to this company on change. */
  focusedId: string | null;
  onMarkerClick?: (id: string) => void;
};

export default function StartupMap({
  companies,
  focusedId,
  onMarkerClick,
}: Props) {
  return (
    <MapContainer
      center={INITIAL_CENTER}
      zoom={INITIAL_ZOOM}
      minZoom={6}
      maxZoom={17}
      maxBounds={UTAH_BOUNDS}
      maxBoundsViscosity={0.85}
      scrollWheelZoom
      className="h-full w-full bg-surface-tint"
      attributionControl
      worldCopyJump={false}
      zoomControl
    >
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
        maxZoom={19}
      />
      <Markers
        companies={companies}
        focusedId={focusedId}
        onMarkerClick={onMarkerClick}
      />
      <FocusFlyTo companies={companies} focusedId={focusedId} />
    </MapContainer>
  );
}

function Markers({
  companies,
  focusedId,
  onMarkerClick,
}: {
  companies: Company[];
  focusedId: string | null;
  onMarkerClick?: (id: string) => void;
}) {
  return (
    <>
      {companies.map((c) => {
        const focused = c.id === focusedId;
        return (
          <Marker
            key={c.id}
            position={[c.lat, c.lng]}
            icon={getMarkerIcon(getSectorColor(c.sector), focused)}
            zIndexOffset={focused ? 1000 : 0}
            eventHandlers={{
              click: () => onMarkerClick?.(c.id),
            }}
          >
            <Popup
              minWidth={260}
              maxWidth={320}
              className="startup-popup"
              autoPan
            >
              <CompanyCard company={c} />
            </Popup>
          </Marker>
        );
      })}
    </>
  );
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
    map.flyTo([target.lat, target.lng], Math.max(map.getZoom(), 13), {
      duration: 0.85,
      easeLinearity: 0.4,
    });
  }, [focusedId, companies, map]);

  return null;
}

function CompanyCard({ company }: { company: Company }) {
  const color = getSectorColor(company.sector);
  return (
    <div className="text-[13px]">
      <div className="flex items-center gap-2">
        <span
          className="inline-flex h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span
          className="text-[10px] font-medium uppercase tracking-[0.16em]"
          style={{ color }}
        >
          {company.sector}
        </span>
      </div>
      <h3 className="mt-2 font-display text-[18px] font-semibold leading-tight text-ink">
        {company.name}
      </h3>
      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] uppercase tracking-[0.12em] text-ink-mute">
        <span>{company.stage}</span>
        <span aria-hidden="true">·</span>
        <span>
          {company.employees === "Unknown"
            ? "—"
            : `${company.employees} employees`}
        </span>
      </div>
      {company.description && (
        <p className="mt-3 line-clamp-4 text-[12.5px] leading-relaxed text-ink-soft">
          {company.description}
        </p>
      )}
      {company.address && (
        <p className="mt-3 text-[11.5px] text-ink-mute">{company.address}</p>
      )}
      <div className="mt-4 flex items-center gap-2">
        {company.website && (
          <a
            href={company.website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-full bg-ink px-3 py-1.5 text-[11px] font-medium text-surface hover:bg-ink-soft"
          >
            Visit website
            <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
              <path
                d="M4 2h6v6M10 2L3 9"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
          </a>
        )}
        {company.linkedin && (
          <a
            href={company.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-full border border-ink/15 px-3 py-1.5 text-[11px] font-medium text-ink hover:border-ink/30"
          >
            LinkedIn
          </a>
        )}
      </div>
    </div>
  );
}
