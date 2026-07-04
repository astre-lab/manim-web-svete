#!/usr/bin/env -S deno run --allow-read --allow-write

import { Project, SyntaxKind } from "ts-morph";

const REGISTRY = "src/lib/animations/registry.ts";
const TEMPLATE = "src/lib/templates/+page.svelte";
const ROUTES = "src/routes/animations";
const BACKUP_DIR = "scripts/backups";

function prompt(question: string, defaultValue = ""): Promise<string> {
  const suffix = defaultValue ? ` [${defaultValue}]` : "";
  const value = globalThis.prompt(`${question}${suffix}:`)?.trim() ?? "";
  return value || defaultValue;
}

function validateId(id: string): boolean {
  if (id.length === 0 || id.length > 64) return false;

  if (/[\x00-\x1F\x7F]/.test(id)) return false;

  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id);
}

async function main() {
  try {
    await Deno.mkdir(BACKUP_DIR, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backup = `${BACKUP_DIR}/registry-${timestamp}.ts`;

    await Deno.copyFile(REGISTRY, backup);

    console.log(`✔ Backup created: ${backup}\n`);

    const project = new Project();

    const source = project.addSourceFileAtPath(REGISTRY);

    const variable = source.getVariableDeclarationOrThrow("animations");

    const initializer = variable.getInitializerOrThrow();

    const array = initializer.isKind(SyntaxKind.ArrayLiteralExpression)
      ? initializer
      : initializer
        .asKindOrThrow(SyntaxKind.SatisfiesExpression)
        .getExpression()
        .asKindOrThrow(SyntaxKind.ArrayLiteralExpression);

    const existing = array.getElements().map((e) =>
      e
        .asKindOrThrow(SyntaxKind.ObjectLiteralExpression)
        .getProperty("id")
        ?.asKindOrThrow(SyntaxKind.PropertyAssignment)
        .getInitializerIfKindOrThrow(SyntaxKind.StringLiteral)
        .getLiteralText()
    );

    const id = prompt("Animation ID");

    if (!validateId(id)) {
      console.error(
        "\n❌ Invalid animation ID.\nOnly lowercase letters, numbers and hyphens are allowed.",
      );
      return;
    }

    if (existing.includes(id)) {
      console.error(`\n❌ ID "${id}" already exists.`);
      return;
    }

    const title = prompt("Title");
    const description = prompt("Description");
    const thumbnail = prompt("Thumbnail");
    const category = prompt("Category");
    const tagsInput = prompt("Tags (comma separated)");
    const path = prompt("Path", `/animations/${id}`);

    const animationDir = `${ROUTES}/${id}`;
    const pageFile = `${animationDir}/+page.svelte`;

    try {
      await Deno.stat(pageFile);
      console.error(`\n❌ ${pageFile} already exists.`);
      return;
    } catch (err) {
      if (!(err instanceof Deno.errors.NotFound)) throw err;
    }

    const tags = tagsInput
      ? tagsInput
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean)
      : [];

    const properties = [
      `id: "${id}"`,
      `title: "${title}"`,
      ...(description ? [`description: "${description}"`] : []),
      ...(thumbnail ? [`thumbnail: "${thumbnail}"`] : []),
      ...(category ? [`category: "${category}"`] : []),
      ...(tags.length
        ? [`tags: [${tags.map((t) => `"${t}"`).join(", ")}]`]
        : []),
      `path: "${path}"`,
    ];

    array.addElement(`{
  ${properties.join(",\n  ")}
}`);

    source.formatText();

    await source.save();

    await Deno.mkdir(animationDir, { recursive: true });

    await Deno.copyFile(TEMPLATE, pageFile);

    console.log(`✔ Created ${pageFile}`);
    console.log("\n✅ Animation appended successfully.");
  } catch (err) {
    console.error("\n❌ Failed to update registry.");
    console.error(err);

    console.error(
      "\nIf any data was lost, restore the latest backup from:",
    );
    console.error(BACKUP_DIR);
  }
}

await main();
