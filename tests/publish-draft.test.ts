import { expect, mock, test } from "bun:test";

// The row publishDraft locks: an agent pushed a new draft after the page rendered.
const viewed = new Date(1_000);
const locked = { id: "plan-id", title: "Plan", draft_html: "<p>pushed later</p>", draft_summary: null, draft_dirty: true, draft_updated_at: new Date(2_000) };
const inserts: unknown[][] = [];
const tx = (strings: TemplateStringsArray, ...values: unknown[]) => {
  const query = strings.join("?");
  if (query.includes("for update")) return Promise.resolve([locked]);
  if (query.includes("max(version)")) return Promise.resolve([{ next: 1 }]);
  if (query.includes("insert into plan_versions")) inserts.push(values);
  return Promise.resolve([]);
};
mock.module("../src/db.ts", () => ({ sql: { begin: (fn: (t: typeof tx) => unknown) => fn(tx) } }));

// The query string keeps this import off plans.test.ts's mock of the same module.
const { publishDraft } = await import("../src/plans.ts?publish-draft");

test("publish refuses a draft that changed after the user viewed it", async () => {
  expect(await publishDraft("plan-id", "you", String(viewed.getTime()))).toBeNull();
  expect(inserts).toEqual([]);
});

test("publish snapshots the draft the user viewed", async () => {
  expect(await publishDraft("plan-id", "you", String(locked.draft_updated_at.getTime()))).toEqual({ version: 1 });
  expect(inserts).toHaveLength(1);
});
