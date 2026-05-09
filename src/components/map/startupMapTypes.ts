import type { ReactNode } from "react";
import type { ClaimStatus } from "@/hooks/useCompanyClaims";
import type { Company } from "@/lib/map-config";

export type StartupMapProps = {
  companies: Company[];
  allCompanies: Company[];
  focusedId: string | null;
  onMarkerClick?: (id: string) => void;
  inWatchlist?: (company: Company) => boolean;
  onToggleWatchlist?: (company: Company) => void;
  compareIds?: string[];
  onToggleCompare?: (company: Company) => void;
  getClaimStatus?: (companyId: string) => ClaimStatus;
  onClaimCompany?: (company: Company) => void;
  mapLayoutRevision?: number;
  mapChrome?: ReactNode;
};
