#!/usr/bin/env bun

import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import {
  ensurePlanDirectory,
  openPlan,
  refreshPlan,
  resolvePlanLocation,
} from "./lib";

type CliCommand = "resolve" | "prepare" | "open" | "refresh";
type Options = Readonly<Record<string, string>>;

function parseOptions(args: readonly string[]): Options {
  const options: Record<string, string> = {};
  for (let index = 0; index < args.length; index += 2) {
    const key = args[index];
    const value = args[index + 1];
    if (!key?.startsWith("--") || value === undefined || value.startsWith("--")) {
      throw new Error(`Expected --name value pairs; received: ${args.join(" ")}`);
    }
    options[key.slice(2)] = value;
  }
  return options;
}

function required(options: Options, name: string): string {
  const value = options[name];
  if (!value) {
    throw new Error(`Missing required option --${name}`);
  }
  return value;
}

function commandFrom(value: string | undefined): CliCommand {
  if (
    value === "resolve" ||
    value === "prepare" ||
    value === "open" ||
    value === "refresh"
  ) {
    return value;
  }
  throw new Error("Usage: html-plan.ts <resolve|prepare|open|refresh> [options]");
}

export function runCli(args: readonly string[]): void {
  const command = commandFrom(args[0]);
  const options = parseOptions(args.slice(1));

  if (command === "resolve" || command === "prepare") {
    const location = resolvePlanLocation(
      required(options, "project-root"),
      required(options, "slug"),
      options["plan-dir"],
    );
    if (command === "prepare") {
      ensurePlanDirectory(location);
    }
    process.stdout.write(`${JSON.stringify(location, null, 2)}\n`);
    return;
  }

  const file = required(options, "file");
  const result = command === "open" ? openPlan(file) : refreshPlan(file);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

function isMainModule(): boolean {
  const entry = process.argv[1];
  return Boolean(entry && resolve(entry) === fileURLToPath(import.meta.url));
}

if (isMainModule()) {
  try {
    runCli(process.argv.slice(2));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`html-plan: ${message}\n`);
    process.exitCode = 1;
  }
}
