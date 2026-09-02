#!/usr/bin/env bun
// html-plan — CLI for the HTML plan host.
//
// Commands:
//   html-plan push --file <path> [options]
//
// `push` uploads an HTML file to a plan's DRAFT. It never mints a published
// version; publishing is a human, session-gated action in the web UI's top bar.
//
// Config (flags override env):
//   --url    PLAN_HOST_URL     base URL, e.g. https://milad-plans.herokuapp.com
//   --token  PLAN_HOST_TOKEN   the PUBLISH_TOKEN config var

import { readFileSync } from "node:fs";

const USAGE = `html-plan — manage HTML plans on the host service

Usage:
  html-plan push --file <path> [options]

push options:
  --file <path>          HTML file to upload (required)
  --slug <slug>          update an existing plan's draft; omit to create a new plan
  --title <title>        defaults to the <title> in the HTML
  --description <text>   what the plan is about (plan-level)
  --summary <text>       what changed since the last published version
  --url <url>            service base URL   (or PLAN_HOST_URL)
  --token <token>        publish token      (or PLAN_HOST_TOKEN)

push writes the DRAFT only. Publish a version from the top bar in the web UI.`;

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

async function push(args) {
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
}

const [command, ...rest] = process.argv.slice(2);

if (!command || command === "help" || command === "--help" || command === "-h") {
  console.log(USAGE);
  process.exit(command ? 0 : 1);
}

if (command === "push") {
  await push(parseArgs(rest));
} else {
  die(`unknown command "${command}". Run "html-plan --help".`);
}
