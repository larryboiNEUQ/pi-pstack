import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const RESERVED_RULE_KEYS = new Set(["description", "alwaysApply", "name", "model", "thinking"]);
const THINKING = "off|minimal|low|medium|high|xhigh|max";
const PI_MODEL = new RegExp(`^[^/\\s:,]+/[^\\s:,]+:(${THINKING})$`);

function markdownFiles(root) {
  const files = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) files.push(...markdownFiles(path));
    else if (entry.isFile() && entry.name.endsWith(".md")) files.push(path);
  }
  return files.sort();
}

export function validateRoleCatalog({ sourceDir, catalogPath, defaultsPath }) {
  const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
  if (!Array.isArray(catalog.roles) || !Array.isArray(catalog.upstreamRoles)) {
    throw new Error(`Invalid role catalog: ${catalogPath}`);
  }
  const names = new Set();
  for (const role of catalog.roles) {
    if (
      typeof role.name !== "string" || !role.name.trim() || names.has(role.name) ||
      !["skill", "purpose", "category"].every((key) => typeof role[key] === "string" && role[key].trim())
    ) {
      throw new Error(`Invalid or duplicate role ${JSON.stringify(role.name)} in ${catalogPath}`);
    }
    names.add(role.name);
  }
  for (const name of catalog.upstreamRoles) {
    if (!names.has(name)) throw new Error(`Unregistered upstream role ${JSON.stringify(name)} in ${catalogPath}`);
  }

  const defaultNames = new Set();
  for (const line of readFileSync(defaultsPath, "utf8").split(/\r?\n/)) {
    if (!line.trim() || line.startsWith("#")) continue;
    const separator = line.indexOf(": ");
    if (separator < 1) throw new Error(`Invalid model row in ${defaultsPath}: ${line}`);
    const name = line.slice(0, separator);
    if (!names.has(name) || defaultNames.has(name)) {
      throw new Error(`Unknown or duplicate model role ${JSON.stringify(name)} in ${defaultsPath}`);
    }
    defaultNames.add(name);
    for (const model of line.slice(separator + 2).split(",").map((value) => value.trim())) {
      if (!["auto", "inherit-parent"].includes(model) && !PI_MODEL.test(model)) {
        throw new Error(`Invalid Pi model ${JSON.stringify(model)} for ${name} in ${defaultsPath}`);
      }
    }
  }
  for (const name of names) {
    if (!defaultNames.has(name)) throw new Error(`Missing published default for ${name} in ${defaultsPath}`);
  }

  const setupPath = join(sourceDir, "pstack/skills/setup-pstack/SKILL.md");
  const setup = readFileSync(setupPath, "utf8");
  const section = /\n### 5\.[^\n]*\n([\s\S]*?)(?=\n### 6\.|$)/.exec(setup);
  const block = section && /```[^\n]*\n([\s\S]*?)\n```/.exec(section[1]);
  if (!block) throw new Error(`Cannot locate upstream model-role table in ${setupPath}`);
  const upstreamNames = new Set();
  let inRuleHeader = false;
  for (const line of block[1].split(/\r?\n/)) {
    if (line === "---") {
      inRuleHeader = !inRuleHeader;
      continue;
    }
    if (!line.trim() || line.startsWith("#")) continue;
    const separator = line.indexOf(": ");
    if (separator < 1) throw new Error(`Unrecognized upstream role row in ${setupPath}: ${line}`);
    const name = line.slice(0, separator);
    if (inRuleHeader && RESERVED_RULE_KEYS.has(name)) continue;
    if (!names.has(name) || !catalog.upstreamRoles.includes(name)) {
      throw new Error(`Unregistered role ${JSON.stringify(name)} in ${setupPath}`);
    }
    if (upstreamNames.has(name)) throw new Error(`Duplicate upstream role ${name} in ${setupPath}`);
    upstreamNames.add(name);
  }
  if (!upstreamNames.size) throw new Error(`Empty upstream role table in ${setupPath}`);
  for (const name of catalog.upstreamRoles) {
    if (!upstreamNames.has(name)) throw new Error(`Retired or renamed role ${name} in ${setupPath}`);
  }

  // Role references can reveal a new seat before setup's table is updated.
  for (const file of markdownFiles(join(sourceDir, "pstack/skills"))) {
    const text = readFileSync(file, "utf8");
    if (!text.includes("pstack-models")) continue;
    for (const match of text.matchAll(/`([^`]+)` line/g)) {
      const name = match[1];
      if (name.startsWith("#")) continue;
      if (!names.has(name)) throw new Error(`Unregistered role ${JSON.stringify(name)} in ${file}`);
    }
  }
}
