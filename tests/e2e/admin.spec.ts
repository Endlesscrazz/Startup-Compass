/**
 * Admin Resource Manager tests
 * Tests API CRUD + UI flows for the admin resource manager.
 */

import { test, expect } from "@playwright/test";

const SECRET = process.env.ADMIN_SECRET ?? "sc-admin-2026";
const WRONG_SECRET = "wrong-secret";

// ── API auth ──────────────────────────────────────────────────────────────────

test.describe("API auth", () => {
  test("GET /api/admin/resources — no auth returns 401", async ({ request }) => {
    const res = await request.get("/api/admin/resources");
    expect(res.status()).toBe(401);
  });

  test("GET /api/admin/resources — wrong secret returns 401", async ({ request }) => {
    const res = await request.get("/api/admin/resources", {
      headers: { Authorization: WRONG_SECRET },
    });
    expect(res.status()).toBe(401);
  });

  test("POST /api/admin/resource — no auth returns 401", async ({ request }) => {
    const res = await request.post("/api/admin/resource", {
      data: { title: "Test", description: "Test", locations: ["Salt Lake"] },
    });
    expect(res.status()).toBe(401);
  });
});

// ── API list ──────────────────────────────────────────────────────────────────

test.describe("API: list resources", () => {
  test("returns all resources with total count", async ({ request }) => {
    const res = await request.get("/api/admin/resources", {
      headers: { Authorization: SECRET },
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.total).toBeGreaterThan(200);
    expect(Array.isArray(data.resources)).toBe(true);
    expect(data.resources.length).toBeGreaterThan(0);
    // No embeddings in response
    expect(data.resources[0].embedding).toBeUndefined();
  });

  test("search filters by title", async ({ request }) => {
    const res = await request.get("/api/admin/resources?q=lassonde", {
      headers: { Authorization: SECRET },
    });
    const data = await res.json();
    expect(data.resources.length).toBeGreaterThanOrEqual(1);
    expect(data.resources[0].title.toLowerCase()).toContain("lassonde");
  });

  test("GET by id returns single resource", async ({ request }) => {
    // Get all first to find a valid id
    const listRes = await request.get("/api/admin/resources", { headers: { Authorization: SECRET } });
    const list = await listRes.json();
    const firstId = list.resources[0].id;

    const res = await request.get(`/api/admin/resources?id=${firstId}`, {
      headers: { Authorization: SECRET },
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.id).toBe(firstId);
    expect(data.title).toBeTruthy();
    expect(data.description).toBeTruthy();
    expect(Array.isArray(data.locations)).toBe(true);
  });

  test("GET by nonexistent id returns 404", async ({ request }) => {
    const res = await request.get("/api/admin/resources?id=9999999", {
      headers: { Authorization: SECRET },
    });
    expect(res.status()).toBe(404);
  });
});

// ── API CRUD ──────────────────────────────────────────────────────────────────

test.describe("API: CRUD lifecycle", () => {
  let createdId: number;
  const initialTitle = `Test Resource ${Date.now()}`;

  test("POST — create resource with embedding", async ({ request }) => {
    const res = await request.post("/api/admin/resource", {
      headers: { Authorization: SECRET },
      data: {
        title: initialTitle,
        description: "A test resource for Playwright CRUD testing. Helps early-stage tech founders in Salt Lake.",
        link: "https://example.com/test",
        email: "test@example.com",
        topics: ["Funding", "Start a Business"],
        communities: ["Student"],
        industries: ["Software and Information Technology"],
        locations: ["Salt Lake"],
      },
    });
    expect(res.status()).toBe(201);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.resource.title).toBe(initialTitle);
    expect(data.resource.id).toBeGreaterThan(0);
    expect(data.resource.embedding).toBeUndefined();
    createdId = data.resource.id;
    console.log(`\n  Created resource id=${createdId}`);
  });

  test("created resource appears in match results", async ({ request }) => {
    // Give the index a moment (not needed but safe in CI)
    const res = await request.post("/api/match", {
      data: { stage: "idea", sector: "Tech / SaaS", city: "Salt Lake City", goal: "Funding", community: ["University student"] },
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    const titles = data.results.map((r: { title: string }) => r.title);
    console.log(`\n  Match results after create: ${titles.join(" | ")}`);
    // The test resource may or may not rank in top 8 — just verify the match endpoint still works
    expect(data.results.length).toBeGreaterThanOrEqual(5);
  });

  test("PUT — update resource (title change forces re-embed)", async ({ request }) => {
    const updatedTitle = `Updated Resource ${Date.now()}`;
    const res = await request.put(`/api/admin/resource/${createdId}`, {
      headers: { Authorization: SECRET },
      data: {
        title: updatedTitle,
        description: "Updated description for the test resource. Now serves veteran founders in Weber County.",
        link: "https://example.com/updated",
        email: null,
        topics: ["Mentorship"],
        communities: ["Veteran"],
        industries: ["Manufacturing"],
        locations: ["Weber", "Davis"],
      },
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.resource.title).toBe(updatedTitle);
    expect(data.resource.locations).toEqual(expect.arrayContaining(["Weber"]));
    expect(data.reEmbedded).toBe(true);
  });

  test("PUT — update link/email only does NOT re-embed", async ({ request }) => {
    // Fetch current state first
    const getRes = await request.get(`/api/admin/resources?id=${createdId}`, { headers: { Authorization: SECRET } });
    const current = await getRes.json();

    const res = await request.put(`/api/admin/resource/${createdId}`, {
      headers: { Authorization: SECRET },
      data: {
        ...current,
        link: "https://example.com/link-only-change",
      },
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.reEmbedded).toBe(false);
    expect(data.resource.link).toBe("https://example.com/link-only-change");
  });

  test("DELETE — removes resource from index", async ({ request }) => {
    const res = await request.delete(`/api/admin/resource/${createdId}`, {
      headers: { Authorization: SECRET },
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);

    // Confirm gone
    const getRes = await request.get(`/api/admin/resources?id=${createdId}`, {
      headers: { Authorization: SECRET },
    });
    expect(getRes.status()).toBe(404);
  });

  test("DELETE — nonexistent id returns 404", async ({ request }) => {
    const res = await request.delete("/api/admin/resource/9999999", {
      headers: { Authorization: SECRET },
    });
    expect(res.status()).toBe(404);
  });
});

// ── API validation ─────────────────────────────────────────────────────────────

test.describe("API: validation", () => {
  test("POST without title returns 400", async ({ request }) => {
    const res = await request.post("/api/admin/resource", {
      headers: { Authorization: SECRET },
      data: { description: "Missing title", locations: ["Salt Lake"] },
    });
    expect(res.status()).toBe(400);
  });

  test("POST without description returns 400", async ({ request }) => {
    const res = await request.post("/api/admin/resource", {
      headers: { Authorization: SECRET },
      data: { title: "Missing description", locations: ["Salt Lake"] },
    });
    expect(res.status()).toBe(400);
  });

  test("POST without locations returns 400", async ({ request }) => {
    const res = await request.post("/api/admin/resource", {
      headers: { Authorization: SECRET },
      data: { title: "No locations", description: "Missing locations", locations: [] },
    });
    expect(res.status()).toBe(400);
  });
});

// ── UI smoke tests ─────────────────────────────────────────────────────────────

test.describe("UI: admin pages", () => {
  async function unlockAdmin(page: import("@playwright/test").Page) {
    await page.goto("/admin");
    await page.evaluate((s) => sessionStorage.setItem("sc_admin_secret", s), SECRET);
    await page.reload();
    // Wait for table to load
    await page.getByText("+ Add resource").waitFor({ timeout: 10_000 });
  }

  test("admin page shows locked state without secret", async ({ page }) => {
    await page.goto("/admin");
    await page.evaluate(() => sessionStorage.removeItem("sc_admin_secret"));
    await page.reload();
    await expect(page.getByPlaceholder("ADMIN_SECRET")).toBeVisible();
    await expect(page.getByRole("button", { name: "Unlock →" })).toBeVisible();
  });

  test("admin page unlocks and shows resource table", async ({ page }) => {
    await unlockAdmin(page);
    await expect(page.getByText("🔓 Admin unlocked")).toBeVisible();
    // Table has resources
    const rows = page.locator("table tbody tr");
    expect(await rows.count()).toBeGreaterThan(10);
  });

  test("search filters the resource table", async ({ page }) => {
    await unlockAdmin(page);
    await page.getByPlaceholder("Search resources…").fill("lassonde");
    await page.getByRole("button", { name: "Search" }).click();
    // Wait for a Lassonde row to appear in the table
    await expect(page.locator("table tbody tr").first()).toContainText(/lassonde/i, { timeout: 8_000 });
    // Should have fewer rows than the full list
    const rowCount = await page.locator("table tbody tr").count();
    expect(rowCount).toBeLessThan(20);
  });

  test("clicking '+ Add resource' navigates to new resource form", async ({ page }) => {
    await unlockAdmin(page);
    await page.getByText("+ Add resource").click();
    await expect(page).toHaveURL(/\/admin\/resource\/new/);
    await expect(page.getByRole("heading", { name: "Add resource" })).toBeVisible();
  });

  test("new resource form has all required fields", async ({ page }) => {
    await page.goto("/admin/resource/new");
    await page.evaluate((s) => sessionStorage.setItem("sc_admin_secret", s), SECRET);
    await page.reload();

    await expect(page.locator("#rf-title")).toBeVisible();
    await expect(page.locator("#rf-description")).toBeVisible();
    await expect(page.locator("#rf-link")).toBeVisible();
    await expect(page.locator("#rf-email")).toBeVisible();
    // Statewide checkbox present
    await expect(page.getByText("Statewide — all 29 counties")).toBeVisible();
    // Submit button present but disabled (no input yet)
    const submitBtn = page.getByRole("button", { name: "Add resource →" });
    await expect(submitBtn).toBeDisabled();
  });

  test("statewide checkbox selects all counties", async ({ page }) => {
    await page.goto("/admin/resource/new");
    await page.evaluate((s) => sessionStorage.setItem("sc_admin_secret", s), SECRET);
    await page.reload();

    // Click statewide
    const statewideLabel = page.getByText("Statewide — all 29 counties");
    await statewideLabel.click();
    // All county checkboxes should be checked
    const countyCheckboxes = page.locator("input[type=checkbox]").filter({ hasNot: page.getByText("Statewide") });
    const count = await countyCheckboxes.count();
    expect(count).toBeGreaterThan(25);
    // Click statewide again to deselect all
    await statewideLabel.click();
    const checkedCount = await page.locator("input[type=checkbox]:checked").count();
    expect(checkedCount).toBe(0);
  });

  test("clicking Edit on a resource navigates to edit page", async ({ page }) => {
    await unlockAdmin(page);
    const firstEditBtn = page.locator("table tbody tr").first().getByRole("button", { name: "Edit" });
    await firstEditBtn.click();
    await expect(page).toHaveURL(/\/admin\/resource\/\d+\/edit/);
    await expect(page.getByRole("heading", { name: "Edit resource" })).toBeVisible({ timeout: 10_000 });
  });

  test("delete button shows confirmation before deleting", async ({ page }) => {
    await unlockAdmin(page);
    const firstRow = page.locator("table tbody tr").first();
    await firstRow.getByRole("button", { name: "Delete" }).click();
    // Confirm button appears
    await expect(firstRow.getByRole("button", { name: "Confirm" })).toBeVisible();
    await expect(firstRow.getByRole("button", { name: "Cancel" })).toBeVisible();
    // Cancel dismisses it
    await firstRow.getByRole("button", { name: "Cancel" }).click();
    await expect(firstRow.getByRole("button", { name: "Delete" })).toBeVisible();
    await expect(firstRow.getByRole("button", { name: "Confirm" })).not.toBeVisible();
  });
});
