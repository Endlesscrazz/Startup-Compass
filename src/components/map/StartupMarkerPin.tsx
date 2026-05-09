"use client";

import type { CSSProperties } from "react";
import { getBuildingScale } from "@/lib/map/buildingScale";
import {
  getCompanyInitials,
  getCompanyLogoUrl,
} from "@/lib/map/companyLogos";
import type { Company } from "@/lib/map-config";
import { getSectorColor } from "@/lib/map-config";

type Props = {
  company: Company;
  focused: boolean;
  saved: boolean;
};

export function StartupMarkerPin({ company, focused, saved }: Props) {
  const logoUrl = getCompanyLogoUrl(company) ?? "";
  const sector = getSectorColor(company.sector);
  const initials = getCompanyInitials(company);
  const { towerHeight, towerWidth } = getBuildingScale(company);
  const size = focused ? 42 : 34;
  const ring = focused ? 3 : 2;
  const roofOverlap = 9;

  return (
    <div className="startup-marker-logo-wrap startup-marker-logo-wrap--maplibre">
      <div className="startup-marker-pin">
        <div className="startup-marker-pin__roof">
          <div
            className={`startup-marker-logo${focused ? " startup-marker-logo--pulse" : ""}`}
            style={
              {
                width: size,
                height: size,
                "--sector": sector,
                "--ring": `${ring}px`,
              } as CSSProperties
            }
          >
            {saved ? (
              <span className="startup-marker-bookmark" aria-hidden="true">
                ★
              </span>
            ) : null}
            <div className="startup-marker-logo__inner">
              {logoUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className="startup-marker-img"
                    src={logoUrl}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.classList.add("startup-marker-img--hide");
                      const n = e.currentTarget.nextElementSibling;
                      n?.classList.add("startup-marker-initials--show");
                    }}
                  />
                  <span className="startup-marker-initials">{initials}</span>
                </>
              ) : (
                <span className="startup-marker-initials startup-marker-initials--show">
                  {initials}
                </span>
              )}
            </div>
          </div>
        </div>
        <div
          className="startup-marker-tower"
          style={
            {
              "--tower-h": `${towerHeight}px`,
              "--tower-w": `${towerWidth}px`,
              "--sector": sector,
              "--roof-overlap": `${roofOverlap}px`,
            } as CSSProperties
          }
          aria-hidden="true"
        >
          <span className="startup-marker-tower__face" />
          <span className="startup-marker-tower__side" />
          <span className="startup-marker-tower__cap" />
        </div>
      </div>
    </div>
  );
}
