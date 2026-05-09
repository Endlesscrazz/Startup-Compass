import type { DivIcon } from "leaflet";
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

const iconCache = new Map<string, any>();

/**
 * Circular logo / initials marker with a sector-colored ring (colors from dataset palette).
 */
export function getStartupMarkerIcon(
  company: Company,
  opts: { focused: boolean; saved: boolean },
): any {
  const logoUrl = getCompanyLogoUrl(company) ?? "";
  const key = `${company.id}:${opts.focused}:${opts.saved}:${logoUrl}`;
  const hit = iconCache.get(key);
  if (hit) return hit;

  const color = getSectorColor(company.sector);
  const initials = escapeAttr(getCompanyInitials(company));
  const size = opts.focused ? 42 : 34;
  const ring = opts.focused ? 3 : 2;
  const pulse = opts.focused ? " startup-marker-logo--pulse" : "";

  const bookmark = opts.saved
    ? `<span class="startup-marker-bookmark" aria-hidden="true">★</span>`
    : "";

  const imgBlock = logoUrl
    ? `<img class="startup-marker-img" src="${escapeAttr(logoUrl)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.classList.add('startup-marker-img--hide');var n=this.nextElementSibling; if(n) n.classList.add('startup-marker-initials--show');" /><span class="startup-marker-initials">${initials}</span>`
    : `<span class="startup-marker-initials startup-marker-initials--show">${initials}</span>`;

  const html = `
    <div class="startup-marker-logo${pulse}" style="width:${size}px;height:${size}px;--sector:${color};--ring:${ring}px">
      ${bookmark}
      <div class="startup-marker-logo__inner">
        ${imgBlock}
      </div>
    </div>
  `;

  const L = require("leaflet");
  const icon = L.divIcon({
    html,
    className: "startup-marker-logo-wrap",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
  iconCache.set(key, icon);
  return icon;
}
