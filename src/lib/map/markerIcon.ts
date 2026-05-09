import { getBuildingScale } from "@/lib/map/buildingScale";
import {
  getCompanyInitials,
  getCompanyLogoUrl,
} from "@/lib/map/companyLogos";
import type { Company } from "@/lib/map-config";
import { getSectorColor } from "@/lib/map-config";

function escapeAttr(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const iconCache = new Map<string, any>();

/** Leaflet `DivIcon` for startup pin (2D map). */
export function getStartupMarkerIcon(
  company: Company,
  opts: { focused: boolean; saved: boolean },
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  const logoUrl = getCompanyLogoUrl(company) ?? "";
  const { towerHeight, towerWidth } = getBuildingScale(company);
  const key = `${company.id}:${opts.focused}:${opts.saved}:${logoUrl}:${towerHeight}x${towerWidth}`;
  const hit = iconCache.get(key);
  if (hit) return hit;

  const color = getSectorColor(company.sector);
  const initials = escapeAttr(getCompanyInitials(company));
  const size = opts.focused ? 42 : 34;
  const ring = opts.focused ? 3 : 2;
  const pulse = opts.focused ? " startup-marker-logo--pulse" : "";
  const roofOverlap = 9;

  const bookmark = opts.saved
    ? `<span class="startup-marker-bookmark" aria-hidden="true">★</span>`
    : "";

  const imgBlock = logoUrl
    ? `<img class="startup-marker-img" src="${escapeAttr(logoUrl)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.classList.add('startup-marker-img--hide');var n=this.nextElementSibling; if(n) n.classList.add('startup-marker-initials--show');" /><span class="startup-marker-initials">${initials}</span>`
    : `<span class="startup-marker-initials startup-marker-initials--show">${initials}</span>`;

  const html = `
    <div class="startup-marker-pin">
      <div class="startup-marker-pin__roof">
        <div class="startup-marker-logo${pulse}" style="width:${size}px;height:${size}px;--sector:${color};--ring:${ring}px">
          ${bookmark}
          <div class="startup-marker-logo__inner">
            ${imgBlock}
          </div>
        </div>
      </div>
      <div class="startup-marker-tower" style="--tower-h:${towerHeight}px;--tower-w:${towerWidth}px;--sector:${color};--roof-overlap:${roofOverlap}px" aria-hidden="true">
        <span class="startup-marker-tower__face"></span>
        <span class="startup-marker-tower__side"></span>
        <span class="startup-marker-tower__cap"></span>
      </div>
    </div>
  `;

  const totalH = size + towerHeight - roofOverlap;
  const totalW = Math.max(size, towerWidth + 10);

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const L = require("leaflet");
  const icon = L.divIcon({
    html,
    className: "startup-marker-logo-wrap",
    iconSize: [totalW, totalH],
    iconAnchor: [totalW / 2, totalH],
    popupAnchor: [0, -totalH + Math.round(size * 0.35)],
  });
  iconCache.set(key, icon);
  return icon;
}
