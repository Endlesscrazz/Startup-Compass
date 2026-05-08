/**
 * Dataset locations (paths are relative to the repository root).
 *
 * - **Raw** files live in `dataset/` — spreadsheets and CSV exports from GOED.
 * - **Generated** JSON under `src/data/` is produced by Node scripts (`npm run data`).
 *
 * Build scripts use the same locations via `scripts/data-paths.mjs`.
 */

export const rawDataset = {
  /** Utah Startup Map company rows (CSV) */
  mapCompaniesCsv: "dataset/Map Data for Builder Day  - Sheet1.csv",
  /** State resources for the Founder's Navigator (Excel) */
  resourcesWorkbook: "dataset/Resources List - Builder Day.xlsx",
} as const;

export const generatedDataset = {
  /** Normalized companies for `/map` — run `npm run data` after editing the CSV */
  companiesJson: "src/data/companies.json",
} as const;
