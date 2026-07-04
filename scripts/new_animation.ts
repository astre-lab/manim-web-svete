#!/usr/bin/env -S deno run --allow-read --allow-write

import { Project, SyntaxKind } from "ts-morph";

const REGISTRY = "src/lib/animations/registry.ts";
const BACKUP_DIR = "scripts/backups";

async function prompt(question: string, defaultValue = ""): Promise<string> {
  const suffix = defaultValue ? ` [${defaultValue}]` : "";
  const value = globalThis.prompt(`${question}${suffix}:`)?.trim() ?? "";
  return value || defaultValue;
}

async function main() {
  try {
    // Ensure backup directory exists
    await Deno.mkdir(BACKUP_DIR, { recursive: true });

    // Backup registry
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

    const existing = array.getElements().map((e) => {
      return e
        .asKindOrThrow(SyntaxKind.ObjectLiteralExpression)
        .getProperty("id")
        ?.asKindOrThrow(SyntaxKind.PropertyAssignment)
        .getInitializerIfKindOrThrow(SyntaxKind.StringLiteral)
        .getLiteralText();
    });

    const id = await prompt("Animation ID");

    if (existing.includes(id)) {
      console.error(`\n❌ ID "${id}" already exists.`);
      console.error("No changes were made.");
      return;
    }

    const title = await prompt("Title");
    const description = await prompt("Description");
    const thumbnail = await prompt("Thumbnail");
    const category = await prompt("Category");
    const tagsInput = await prompt("Tags (comma separated)");
    const path = await prompt("Path", `/animations/${id}`);

    const tags = tagsInput
      ? tagsInput.split(",").map((x) => x.trim()).filter(Boolean)
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