"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, type Dispatch, type SetStateAction } from "react";

const PARAM = "c";

/**
 * Keeps `?c=<companyId>` in sync with the focused company for shareable map links.
 */
export function useSelectedCompanyUrlState(
  /** Selection that is valid for the current filter set (resolves share + filter conflicts). */
  selectedId: string | null,
  setFocusedId: Dispatch<SetStateAction<string | null>>,
  validIds: ReadonlySet<string>,
) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const q = searchParams.get(PARAM);
    if (q && validIds.has(q)) {
      setFocusedId((prev) => (prev !== q ? q : prev));
      return;
    }
    if (!q) {
      setFocusedId((prev) => (prev !== null ? null : prev));
    }
  }, [searchParams, validIds, setFocusedId]);

  useEffect(() => {
    const q = searchParams.get(PARAM);
    const want =
      selectedId && validIds.has(selectedId) ? selectedId : null;
    if (want === q || (want === null && q === null)) return;
    const params = new URLSearchParams(searchParams.toString());
    if (want) params.set(PARAM, want);
    else params.delete(PARAM);
    const s = params.toString();
    router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false });
  }, [selectedId, pathname, router, searchParams, validIds]);
}
