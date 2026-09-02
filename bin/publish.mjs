#!/usr/bin/env bun
// Push an HTML plan draft to the host service.
//
// This updates the plan's DRAFT only. It never mints a published version. To
// share a milestone, open the draft in the browser and click "Publish version"
// (a human, session-gated action the token cannot perform).
//
// Usage:
//   bun run bin/publish.mjs --file plan.html [--title "My Plan"] [--slug existing-slug]
//     [--description "what this plan is about"]
//     [--summary "what changed since the last published version"]
//
// Config (flags override env):
//   --url    PLAN_HOST_URL      base URL of the service, e.g. https://milad-plans.herokuapp.com
//   --token  PLAN_HOST_TOKEN    the PUBLISH_TOKEN config var
//
// Pass the --slug of an existing plan to overwrite its draft. Omit --slug to
// create a new plan (draft only, nothing published yet).

import { readFileSync } from "node:fs";

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i];
    if (key.startsWith("--")) {
      const name = key.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith("--")) {
        args[name] = next;
        i++;
      } else {
        args[name] = true;
      }
    }
  }
  return args;
}

function titleFromHtml(html) {
  const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return match?.[1]?.trim();
}

function die(message) {
  console.error(`error: ${message}`);
  process.exit(1);
}

const args = parseArgs(process.argv.slice(2));

const file = args.file;
if (!file) die("--file <path> is required");

const baseUrl = (args.url || process.env.PLAN_HOST_URL || "").replace(/\/$/, "");
if (!baseUrl) die("service URL required (--url or PLAN_HOST_URL)");

const token = args.token || process.env.PLAN_HOST_TOKEN;
if (!token) die("publish token required (--token or PLAN_HOST_TOKEN)");

let html;
try {
  html = readFileSync(file, "utf8");
} catch (e) {
  die(`could not read ${file}: ${e.message}`);
}

const title = (typeof args.title === "string" && args.title) || titleFromHtml(html);
if (!title) die("no title: pass --title or include a <title> in the HTML");

const updatedBy =
  process.env.PLAN_HOST_AUTHOR || process.env.USER || process.env.LOGNAME || "cli";

const res = await fetch(`${baseUrl}/api/plans`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    slug: typeof args.slug === "string" ? args.slug : undefined,
    title,
    description: typeof args.description === "string" ? args.description : undefined,
    html,
    summary: typeof args.summary === "string" ? args.summary : undefined,
    updatedBy,
  }),
});

const payload = await res.json().catch(() => ({}));
if (!res.ok) {
  die(`push failed (${res.status}): ${payload.error ?? "unknown error"}`);
}

const verb = payload.created ? "Created draft" : "Updated draft";
console.log(`${verb} for "${payload.title}"`);
console.log(`  draft: ${payload.draftUrl}`);
console.log(`  share: ${payload.shareUrl}  (publish the draft in the top bar to update this)`);
