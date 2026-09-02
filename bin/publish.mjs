#!/usr/bin/env bun
// Publish or update an HTML plan on the host service.
//
// Usage:
//   bun run bin/publish.mjs --file plan.html [--title "My Plan"] [--slug existing-slug]
//
// Config (flags override env):
//   --url    PLAN_HOST_URL      base URL of the service, e.g. https://milad-plans.herokuapp.com
//   --token  PLAN_HOST_TOKEN    the PUBLISH_TOKEN config var
//
// Updating: pass the --slug of an existing plan to add a new version at the
// same durable URL. Omit --slug to create a new plan.

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

const publishedBy =
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
    html,
    publishedBy,
  }),
});

const payload = await res.json().catch(() => ({}));
if (!res.ok) {
  die(`publish failed (${res.status}): ${payload.error ?? "unknown error"}`);
}

const verb = payload.created ? "Created" : "Updated";
console.log(`${verb} "${payload.title}" (version ${payload.version})`);
console.log(payload.url);
