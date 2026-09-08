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

import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const USAGE = `html-plan — manage HTML plans on the host service

Usage:
  html-plan push --file <path> [options]
  html-plan baseline --slug <slug> [--url <url>] [--token <token>]

Defaults: ~/.config/html-plan-host/config.json with url and tokenRef (op://...).
Explicit flags and environment override the file. Tokens are read at runtime.

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

function decodeEntities(s) {
  return s
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&apos;/g, "'")
    .replace(/&mdash;/g, "—").replace(/&ndash;/g, "–").replace(/&middot;/g, "·")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));
}

function titleFromHtml(html) {
  const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const raw = match?.[1]?.trim();
  return raw ? decodeEntities(raw) : undefined;
}

function die(message) {
  console.error(`error: ${message}`);
  process.exit(1);
}

function connection(args) {
  const file = process.env.PLAN_HOST_CONFIG || join(homedir(), ".config/html-plan-host/config.json");
  let defaults = {};
  if (existsSync(file)) {
    try {
      defaults = JSON.parse(readFileSync(file, "utf8"));
    } catch {
      die(`invalid configuration: ${file}`);
    }
    if (!defaults || typeof defaults !== "object" || Array.isArray(defaults)) die("configuration must be an object");
  }
  const configuredUrl = typeof defaults.url === "string" ? defaults.url.replace(/\/$/, "") : "";
  const selectedUrl = args.url || process.env.PLAN_HOST_URL || configuredUrl;
  if (typeof selectedUrl !== "string" || !selectedUrl) die("service URL required (--url, PLAN_HOST_URL, or config file)");
  const baseUrl = selectedUrl.replace(/\/$/, "");
  const url = new URL(baseUrl);
  if (url.protocol !== "https:" && !(url.protocol === "http:" && ["127.0.0.1", "localhost", "[::1]"].includes(url.hostname))) {
    die("service URL must use HTTPS (HTTP is allowed only on loopback)");
  }
  let token = args.token || process.env.PLAN_HOST_TOKEN;
  if (!token && baseUrl === configuredUrl && typeof defaults.tokenRef === "string") {
    if (!defaults.tokenRef.startsWith("op://")) die("tokenRef must be a 1Password secret reference");
    try {
      token = execFileSync("op", ["read", defaults.tokenRef], { encoding: "utf8", timeout: 20000, stdio: ["ignore", "pipe", "pipe"] }).trim();
    } catch {
      die("1Password token read failed; check service-account access and op on PATH");
    }
  }
  if (typeof token !== "string" || !token) die("publish token required for the selected host; refusing to reuse another host's credential");
  return { baseUrl, token };
}

async function baseline(args) {
  if (typeof args.slug !== "string") die("--slug is required");
  const { baseUrl, token } = connection(args);
  const res = await fetch(`${baseUrl}/api/plans/${encodeURIComponent(args.slug)}`, {
    headers: { Authorization: `Bearer ${token}` }, redirect: "error",
  });
  if (!res.ok) die(`baseline failed (${res.status})`);
  console.log(JSON.stringify(await res.json(), null, 2));
}

async function push(args) {
  const file = args.file;
  if (!file) die("--file <path> is required");
  const { baseUrl, token } = connection(args);

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
    redirect: "error",
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
} else if (command === "baseline") {
  await baseline(parseArgs(rest));
} else {
  die(`unknown command "${command}". Run "html-plan --help".`);
}
